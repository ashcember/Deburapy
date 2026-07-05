import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DeburapyStore } from "./core/store.mjs";
import { loadEnvFile } from "./core/env.mjs";
import { deburapyModules } from "./core/modules.mjs";
import {
  loadMediatorPrompt,
  loadMediatorPersonas,
  buildMediatorUserPrompt,
  defaultCompanionPrompt,
  buildCompanionUserPrompt,
  buildSessionClockBlock,
  buildSessionNotePrompt,
  parseMediatorTurn
} from "./core/prompt.mjs";
import { generateChatCompletion, providerDefaults } from "./core/openai-compatible.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
loadEnvFile(path.join(rootDir, ".env"));

const publicDir = path.join(rootDir, "public");
const isServerlessRuntime = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const isCliEntry = process.argv[1] === fileURLToPath(import.meta.url);
const defaultDataDir = isServerlessRuntime ? "/tmp/deburapy-data" : ".deburapy-data";
const dataDir = path.resolve(rootDir, process.env.DEBURAPY_DATA_DIR || defaultDataDir);
const store = new DeburapyStore(dataDir);

const host = process.env.DEBURAPY_HOST || "127.0.0.1";
const port = Number(process.env.DEBURAPY_PORT || 8787);
const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);

if (!isServerlessRuntime && isCliEntry && !loopbackHosts.has(host) && process.env.DEBURAPY_ALLOW_UNSAFE_BIND !== "1") {
  console.error(
    `Refusing to bind unauthenticated API to ${host}. Set DEBURAPY_ALLOW_UNSAFE_BIND=1 only behind your own auth boundary.`
  );
  process.exit(1);
}

class BadRequestError extends Error {}
class HttpStatusError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const hostedDemoProvider = "google-ai-studio";
const hostedDemoDefaults = providerDefaults(hostedDemoProvider);
const hostedDemoApiKey =
  process.env.DEBURAPY_HOSTED_DEMO_GOOGLE_AI_STUDIO_API_KEY ||
  process.env.DEBURAPY_DEMO_GOOGLE_AI_STUDIO_API_KEY ||
  process.env.GOOGLE_AI_STUDIO_API_KEY ||
  process.env.GEMINI_API_KEY ||
  "";
const hostedDemoEnabled = process.env.DEBURAPY_ENABLE_HOSTED_DEMO === "1" && Boolean(hostedDemoApiKey);
const hostedDemoBaseUrl = process.env.DEBURAPY_HOSTED_DEMO_BASE_URL || hostedDemoDefaults.baseUrl;
const hostedDemoModel = process.env.DEBURAPY_HOSTED_DEMO_MODEL || hostedDemoDefaults.model;
const hostedDemoRateLimit = Math.max(1, Number(process.env.DEBURAPY_HOSTED_DEMO_RATE_LIMIT_PER_MINUTE || 12));
const hostedDemoRateWindowMs = 60 * 1000;
const hostedDemoBuckets = new Map();
const hostedDemoRoles = new Set(["pre_intake", "mediator", "session_note", "connection_test"]);

function hostedDemoPublicConfig() {
  return {
    enabled: hostedDemoEnabled,
    provider: hostedDemoProvider,
    baseUrl: hostedDemoBaseUrl,
    model: hostedDemoModel,
    keyMode: hostedDemoEnabled ? "server_hosted" : "byok",
    keyLabel: hostedDemoEnabled ? "Hosted demo key" : ""
  };
}

function wantsHostedDemo(input = {}) {
  return input.useHostedDemoKey === true || input.apiKey === "__DEBURAPY_HOSTED_DEMO_KEY__";
}

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

function checkHostedDemoRateLimit(req) {
  const key = clientIp(req);
  const now = Date.now();
  const bucket = hostedDemoBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    hostedDemoBuckets.set(key, { count: 1, resetAt: now + hostedDemoRateWindowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > hostedDemoRateLimit) {
    throw new HttpStatusError(429, "Hosted demo rate limit reached. Please wait before trying again.");
  }
}

function validateHostedDemoInput(input, role) {
  const maxQuestionLength = role === "pre_intake" ? 1800 : 6000;
  const maxTurnInstructionLength = 800;
  if (String(input.question || "").length > maxQuestionLength) {
    throw new BadRequestError("Hosted demo input is too long.");
  }
  if (String(input.turnInstruction || "").length > maxTurnInstructionLength) {
    throw new BadRequestError("Hosted demo turn instruction is too long.");
  }
}

function resolveModelInput(input, role, req) {
  if (wantsHostedDemo(input)) {
    if (!hostedDemoRoles.has(role)) {
      throw new BadRequestError("Hosted demo key is not available for this endpoint.");
    }
    if (!hostedDemoEnabled) {
      throw new BadRequestError("Hosted demo key is not configured.");
    }
    if (input.provider && input.provider !== hostedDemoProvider) {
      throw new BadRequestError("Hosted demo key only supports Google AI Studio.");
    }
    checkHostedDemoRateLimit(req);
    validateHostedDemoInput(input, role);
    return {
      provider: hostedDemoProvider,
      apiKey: hostedDemoApiKey,
      baseUrl: hostedDemoBaseUrl,
      model: hostedDemoModel,
      usesHostedDemoKey: true
    };
  }

  requiredText(input, "apiKey");
  return {
    provider: input.provider,
    apiKey: input.apiKey,
    baseUrl: input.baseUrl,
    model: input.model,
    usesHostedDemoKey: false
  };
}

function safeBaseUrl(value) {
  if (!value) return undefined;
  try {
    const url = new URL(String(value));
    return `${url.protocol}//${url.host}`;
  } catch {
    return "[invalid-url]";
  }
}

function setRequestLog(req, meta) {
  req.deburapyLog = {
    ...(req.deburapyLog || {}),
    ...Object.fromEntries(Object.entries(meta).filter(([, value]) => value !== undefined && value !== ""))
  };
}

function safeClientLog(input = {}) {
  const allowed = [
    "event",
    "action",
    "message",
    "phase",
    "sessionRunning",
    "countdown",
    "sessionState",
    "askMediatorDisabled",
    "askCompanionDisabled",
    "startDisabled",
    "settingsOpen",
    "consentOpen"
  ];
  const output = {};
  for (const key of allowed) {
    if (input[key] === undefined) continue;
    output[key] = String(input[key]).slice(0, 240);
  }
  return output;
}

function logApiRequest(req, statusCode) {
  if (!req.url?.startsWith("/api/")) return;
  const { url } = routeParts(req);
  const elapsedMs = Date.now() - (req.deburapyStartedAt || Date.now());
  const entry = {
    ts: new Date().toISOString(),
    level: statusCode >= 500 ? "error" : "info",
    method: req.method,
    path: url.pathname,
    status: statusCode,
    elapsedMs,
    ...(req.deburapyLog || {})
  };
  if (req.deburapyError) entry.error = req.deburapyError;
  console.log(JSON.stringify(entry));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, status, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store, max-age=0"
  });
  res.end(text);
}

function sendMarkdownDownload(res, note) {
  const safeName = String(note.title || note.id || "deburapy-session-note")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "deburapy-session-note";
  res.writeHead(200, {
    "content-type": "text/markdown; charset=utf-8",
    "content-disposition": `attachment; filename="${safeName}.md"`
  });
  res.end(note.content);
}

function storageInfo() {
  return {
    dataDir,
    storePath: store.filePath,
    configuredBy: process.env.DEBURAPY_DATA_DIR ? "DEBURAPY_DATA_DIR" : "default",
    envExample: "DEBURAPY_DATA_DIR=/absolute/path/to/deburapy-data",
    canChangeAtRuntime: false
  };
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  if (!body.trim()) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new BadRequestError("Invalid JSON body.");
  }
}

function requiredText(input, field) {
  const value = String(input[field] || "").trim();
  if (!value) throw new BadRequestError(`Missing required field: ${field}`);
  return value;
}

function routeParts(req) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  return { url, parts: url.pathname.split("/").filter(Boolean) };
}

const intakeAssistantSystemPrompt = [
  "You are the Deburapy pre-intake assistant.",
  "You are not the mediator, not the AI companion, and not a therapist.",
  "Your job is to answer questions before consent and first screening.",
  "Explain Deburapy's scope for AI-human relationships: one-on-one support after rupture or AI loss, AI-human room mediation, technical continuity planning, and education.",
  "Be clear that Deburapy is not medical care, legal advice, emergency support, or a guarantee that an account, model, memory, or companion can be restored.",
  "For account loss or bans, explain possible preservation steps at a high level: gather exported data if available, preserve prompts and memory artifacts, document relationship continuity, identify provider constraints, and plan migration to a new runtime.",
  "Do not ask for private API keys, hidden chain-of-thought, secret logs, credentials, or unredacted private data.",
  "If there is imminent self-harm, violence, abuse, medical danger, or legal emergency, tell the user to pause Deburapy and contact immediate local emergency or professional support.",
  "Keep answers brief, calm, practical, and non-clinical."
].join("\n");

function buildIntakeAssistantUserPrompt(input) {
  const screening = input.screening || {};
  return [
    "Pre-consent user question:",
    String(input.question || "").trim(),
    "",
    "Current first-screening selections:",
    `- concern: ${screening.concern || "not selected"}`,
    `- urgency: ${screening.urgency || "not selected"}`,
    "",
    "Answer the question directly. If the question asks for a technical preservation plan, give a concise checklist without requesting secrets or unredacted logs."
  ].join("\n");
}

async function generateSessionNote(roomId, input, req) {
  store.setSessionNoteStatus(roomId, "generating");
  const room = store.getRoom(roomId);
  const modelInput = resolveModelInput(input, "session_note", req);
  const systemPrompt = modelInput.usesHostedDemoKey
    ? await loadMediatorPrompt(input.personaId || "core")
    : input.systemPrompt || await loadMediatorPrompt();
  const userPrompt = buildSessionNotePrompt(room, input.locale || room.locale);
  const content = await generateChatCompletion({
    provider: modelInput.provider,
    apiKey: modelInput.apiKey,
    baseUrl: modelInput.baseUrl,
    model: modelInput.model,
    systemPrompt,
    userPrompt,
    temperature: 0.2
  });
  return store.addSessionNote(roomId, {
    title: `Deburapy Session ${room.session?.sessionNumber || 1} Note`,
    content
  });
}

function serveStatic(req, res, pathname) {
  const target = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(target).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, safePath);
  if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath)) return false;

  const ext = path.extname(filePath);
  const type =
    ext === ".html" ? "text/html; charset=utf-8" :
    ext === ".css" ? "text/css; charset=utf-8" :
    ext === ".js" ? "text/javascript; charset=utf-8" :
    "application/octet-stream";
  sendText(res, 200, fs.readFileSync(filePath), type);
  return true;
}

async function handleApi(req, res) {
  const { url, parts } = routeParts(req);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, product: "Deburapy" });
  }

  if (req.method === "GET" && url.pathname === "/api/storage") {
    return sendJson(res, 200, storageInfo());
  }

  if (req.method === "GET" && url.pathname === "/api/demo-config") {
    return sendJson(res, 200, { mediator: hostedDemoPublicConfig() });
  }

  if (req.method === "GET" && url.pathname === "/api/prompts/mediator") {
    const personaId = url.searchParams.get("persona") || "core";
    return sendJson(res, 200, { personaId, systemPrompt: await loadMediatorPrompt(personaId) });
  }

  if (req.method === "GET" && url.pathname === "/api/prompts/mediator-personas") {
    return sendJson(res, 200, { personas: await loadMediatorPersonas() });
  }

  if (req.method === "POST" && url.pathname === "/api/debug/client-event") {
    const input = await readJson(req);
    setRequestLog(req, {
      source: "browser",
      ...safeClientLog(input)
    });
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/intake/respond") {
    const input = await readJson(req);
    input.question = requiredText(input, "question");
    const modelInput = resolveModelInput(input, "pre_intake", req);
    setRequestLog(req, {
      role: "pre_intake",
      action: "intake_assistant",
      provider: modelInput.provider,
      model: modelInput.model,
      baseUrl: safeBaseUrl(modelInput.baseUrl),
      keyMode: modelInput.usesHostedDemoKey ? "hosted_demo" : "byok"
    });
    const content = await generateChatCompletion({
      provider: modelInput.provider,
      apiKey: modelInput.apiKey,
      baseUrl: modelInput.baseUrl,
      model: modelInput.model,
      systemPrompt: intakeAssistantSystemPrompt,
      userPrompt: buildIntakeAssistantUserPrompt(input),
      temperature: 0.2
    });
    return sendJson(res, 200, { ok: true, content });
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "sessions") {
    const input = await readJson(req);
    const roomId = parts[2] || "default";
    setRequestLog(req, {
      action: "session_create",
      roomId,
      sessionNumber: input.sessionNumber,
      durationMinutes: input.durationMinutes
    });
    const result = store.createSession(roomId, input);
    return sendJson(res, 201, result);
  }

  if (req.method === "PUT" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "course-outline") {
    const input = await readJson(req);
    const roomId = parts[2] || "default";
    setRequestLog(req, {
      action: "course_outline_upsert",
      roomId,
      totalSessions: input.totalSessions,
      reviewCadenceSessions: input.reviewCadenceSessions
    });
    return sendJson(res, 200, store.upsertCourseOutline(roomId, input));
  }

  if (req.method === "GET" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "recall") {
    const roomId = parts[2] || "default";
    return sendJson(res, 200, store.getRoomRecall(roomId, {
      beforeSessionId: url.searchParams.get("beforeSessionId") || undefined
    }));
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "relationship-map") {
    const input = await readJson(req);
    const roomId = parts[2] || "default";
    setRequestLog(req, {
      action: "relationship_map_create",
      roomId,
      afterSessionNumber: input.afterSessionNumber
    });
    return sendJson(res, 201, store.createRelationshipMap(roomId, input));
  }

  if (req.method === "GET" && url.pathname === "/api/modules") {
    return sendJson(res, 200, { modules: deburapyModules });
  }

  if (req.method === "GET" && parts[0] === "api" && parts[1] === "sessions" && parts[2]) {
    const result = store.getSession(parts[2]);
    if (!result) return sendJson(res, 404, { error: "Session not found." });
    return sendJson(res, 200, result);
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "sessions" && parts[3] === "check-in-scale") {
    const input = await readJson(req);
    setRequestLog(req, {
      action: "check_in_scale_create",
      sessionId: parts[2],
      scaleType: input.scaleType
    });
    const result = store.addCheckInScale(parts[2], input);
    if (!result) return sendJson(res, 404, { error: "Session not found." });
    return sendJson(res, 201, result);
  }

  if (req.method === "PATCH" && parts[0] === "api" && parts[1] === "sessions" && parts[3] === "end") {
    const input = await readJson(req);
    setRequestLog(req, {
      action: "session_record_end",
      sessionId: parts[2]
    });
    const result = store.endSessionRecord(parts[2], input);
    if (!result) return sendJson(res, 404, { error: "Session not found." });
    return sendJson(res, 200, result);
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "session" && parts[4] === "start") {
    const input = await readJson(req);
    const roomId = parts[2] || "default";
    setRequestLog(req, {
      action: "session_start",
      roomId,
      sessionNumber: input.sessionNumber,
      durationMinutes: input.durationMinutes
    });
    const room = store.startSession(roomId, input);
    return sendJson(res, 200, { room, session: room.session });
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "session" && parts[4] === "wrap-up") {
    const roomId = parts[2] || "default";
    setRequestLog(req, {
      action: "session_wrap_up",
      roomId
    });
    const room = store.markWrapUpReminderSent(roomId);
    return sendJson(res, 200, { room, session: room.session });
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "session" && parts[4] === "end") {
    const input = await readJson(req);
    const roomId = parts[2] || "default";
    setRequestLog(req, {
      action: "session_end",
      roomId,
      provider: input.provider,
      model: input.model,
      baseUrl: safeBaseUrl(input.baseUrl),
      keyMode: wantsHostedDemo(input) ? "hosted_demo" : "byok"
    });
    const shouldAttemptNote = Boolean(input.apiKey || wantsHostedDemo(input));
    const ended = store.endSession(roomId, { noteStatus: shouldAttemptNote ? "generating" : "error" });
    if (!shouldAttemptNote) {
      return sendJson(res, 200, {
        room: ended,
        session: ended.session,
        note: null,
        noteError: "Mediator API key is missing; session ended without a note."
      });
    }
    try {
      const { room, note } = await generateSessionNote(roomId, input, req);
      return sendJson(res, 200, { room, session: room.session, note });
    } catch (err) {
      store.setSessionNoteStatus(roomId, "error");
      throw err;
    }
  }

  if (req.method === "GET" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "session-notes" && parts[5] === "download") {
    const note = store.getSessionNote(parts[2] || "default", parts[4]);
    if (!note) return sendJson(res, 404, { error: "Session note not found." });
    return sendMarkdownDownload(res, note);
  }

  if (req.method === "GET" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "session-notes") {
    const { room, notes } = store.getSessionNotes(parts[2] || "default");
    return sendJson(res, 200, { room, notes });
  }

  if (req.method === "GET" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "messages") {
    const room = store.getRoom(parts[2] || "default");
    return sendJson(res, 200, { messages: room.messages });
  }

  if (req.method === "GET" && parts[0] === "api" && parts[1] === "rooms") {
    const room = store.getRoom(parts[2] || "default");
    return sendJson(res, 200, { room });
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "messages") {
    const input = await readJson(req);
    input.content = requiredText(input, "content");
    const room = store.addMessage(parts[2] || "default", input);
    return sendJson(res, 201, { room });
  }

  if (req.method === "POST" && url.pathname === "/api/mediator/respond") {
    const input = await readJson(req);
    const modelInput = resolveModelInput(input, "mediator", req);
    const roomId = input.roomId || "default";
    setRequestLog(req, {
      role: "mediator",
      roomId,
      provider: modelInput.provider,
      model: modelInput.model,
      baseUrl: safeBaseUrl(modelInput.baseUrl),
      keyMode: modelInput.usesHostedDemoKey ? "hosted_demo" : "byok"
    });
    const room = store.getRoom(roomId);
    const systemPrompt = modelInput.usesHostedDemoKey
      ? await loadMediatorPrompt(input.personaId || "core")
      : input.systemPrompt || await loadMediatorPrompt();
    const userPrompt = buildMediatorUserPrompt(room, input.locale || room.locale, {
      turnInstruction: input.turnInstruction || ""
    });
    const rawContent = await generateChatCompletion({
      provider: modelInput.provider,
      apiKey: modelInput.apiKey,
      baseUrl: modelInput.baseUrl,
      model: modelInput.model,
      systemPrompt,
      userPrompt,
      temperature: input.temperature
    });
    const { visibleContent, nextSpeaker } = parseMediatorTurn(rawContent);
    const updated = store.addMessage(roomId, {
      authorRole: "mediator",
      authorName: "Deburapy",
      content: visibleContent
    });
    return sendJson(res, 200, { message: updated.messages.at(-1), room: updated, nextSpeaker });
  }

  if (req.method === "POST" && url.pathname === "/api/companion/respond") {
    const input = await readJson(req);
    if (wantsHostedDemo(input)) {
      throw new BadRequestError("Hosted demo key is not available for AI companion API calls.");
    }
    requiredText(input, "apiKey");
    const roomId = input.roomId || "default";
    const room = store.getRoom(roomId);
    const companionName = input.companionName || "AI Companion";
    setRequestLog(req, {
      role: "companion",
      roomId,
      provider: input.provider,
      model: input.model,
      baseUrl: safeBaseUrl(input.baseUrl)
    });
    const systemPrompt = input.systemPrompt || defaultCompanionPrompt(companionName);
    const userPrompt = buildCompanionUserPrompt(room, {
      locale: input.locale || room.locale,
      companionName,
      knowledge: input.knowledge || ""
    });
    const content = await generateChatCompletion({
      provider: input.provider,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
      model: input.model,
      systemPrompt,
      userPrompt,
      temperature: input.temperature
    });
    const updated = store.addMessage(roomId, {
      authorRole: "companion",
      authorName: companionName,
      content,
      kind: "ai_companion_reply"
    });
    return sendJson(res, 200, { message: updated.messages.at(-1), room: updated });
  }

  if (req.method === "POST" && url.pathname === "/api/companion/mcp-request") {
    const input = await readJson(req);
    const roomId = input.roomId || "default";
    setRequestLog(req, {
      role: "companion",
      mode: "mcp",
      roomId,
      targetParticipantId: input.targetParticipantId || "companion"
    });
    const room = store.getRoom(roomId);
    const content = String(input.content || [
      "Deburapy turn request for the external AI companion.",
      "",
      "Please read the current room context and reply as the configured AI companion.",
      "After replying, Deburapy will return the turn to the mediator.",
      "",
      buildSessionClockBlock(room),
      "",
      "Current transcript:",
      room.messages.map((message) => `- ${message.authorName || message.authorRole}: ${message.content}`).join("\n") || "- No messages yet."
    ].join("\n")).trim();
    const push = store.addChannelPush(roomId, "mcp-companion", {
      from: "Deburapy",
      content,
      targetParticipantId: input.targetParticipantId || "companion"
    }, { visible: false });
    return sendJson(res, 201, { push });
  }

  if (req.method === "POST" && url.pathname === "/api/connections/test") {
    const input = await readJson(req);
    const target = input.target === "companion" ? "companion" : "mediator";
    if (target === "companion" && wantsHostedDemo(input)) {
      throw new BadRequestError("Hosted demo key is not available for AI companion API calls.");
    }
    const modelInput = resolveModelInput(input, "connection_test", req);
    setRequestLog(req, {
      role: target,
      action: "connection_test",
      provider: modelInput.provider,
      model: modelInput.model,
      baseUrl: safeBaseUrl(modelInput.baseUrl),
      keyMode: modelInput.usesHostedDemoKey ? "hosted_demo" : "byok"
    });
    const content = await generateChatCompletion({
      provider: modelInput.provider,
      apiKey: modelInput.apiKey,
      baseUrl: modelInput.baseUrl,
      model: modelInput.model,
      systemPrompt: modelInput.usesHostedDemoKey
        ? await loadMediatorPrompt(input.personaId || "core")
        : input.systemPrompt || (target === "companion" ? defaultCompanionPrompt(input.companionName) : await loadMediatorPrompt()),
      userPrompt: [
        "Connection check only.",
        "Reply with one short sentence confirming that this model endpoint is reachable for Deburapy.",
        `Target role: ${target}.`
      ].join("\n"),
      temperature: 0
    });
    return sendJson(res, 200, { ok: true, target, content });
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "channels" && parts[3] === "push") {
    const input = await readJson(req);
    input.content = requiredText(input, "content");
    const push = store.addChannelPush(input.roomId || "default", parts[2], input);
    return sendJson(res, 201, { push });
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "channels" && parts[3] === "reply") {
    const input = await readJson(req);
    input.content = requiredText(input, "content");
    const room = store.addMessage(input.roomId || "default", {
      authorRole: input.authorRole || "companion",
      authorName: input.from || "AI Companion",
      channelId: parts[2],
      content: input.content,
      kind: "channel_reply"
    });
    return sendJson(res, 201, { room });
  }

  if (req.method === "GET" && url.pathname === "/api/mcp/pending") {
    const roomId = url.searchParams.get("roomId") || "default";
    const participantId = url.searchParams.get("participantId") || "companion";
    const limit = Number(url.searchParams.get("limit") || 20);
    const claim = url.searchParams.get("claim") === "1";
    const result = store.getPendingPushes(roomId, participantId, { limit, claim });
    return sendJson(res, 200, result);
  }

  if (req.method === "POST" && url.pathname === "/api/mcp/state") {
    const input = await readJson(req);
    const room = store.setParticipantState(
      input.roomId || "default",
      input.participantId || "companion",
      input.state || {}
    );
    return sendJson(res, 200, { room });
  }

  return sendJson(res, 404, { error: "Not found" });
}

export async function handleRequest(req, res) {
  req.deburapyStartedAt = Date.now();
  const originalWriteHead = res.writeHead;
  res.writeHead = function writeHeadWithStatus(statusCode, ...args) {
    res.deburapyStatusCode = statusCode;
    return originalWriteHead.call(this, statusCode, ...args);
  };
  res.on("finish", () => {
    logApiRequest(req, res.deburapyStatusCode || res.statusCode || 200);
  });

  try {
    const { url } = routeParts(req);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res);
    if (url.pathname === "/favicon.ico") {
      res.writeHead(204, { "cache-control": "public, max-age=86400" });
      res.end();
      return;
    }
    if (serveStatic(req, res, url.pathname)) return;
    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    req.deburapyError = err instanceof Error ? err.message : String(err);
    if (err instanceof BadRequestError) {
      return sendJson(res, 400, { error: err.message });
    }
    if (err instanceof HttpStatusError) {
      return sendJson(res, err.statusCode, { error: err.message });
    }
    if (Number.isInteger(err?.statusCode) && err.statusCode >= 400 && err.statusCode < 600) {
      return sendJson(res, err.statusCode, { error: err.message });
    }
    sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
}

export default handleRequest;

const server = http.createServer(handleRequest);

if (isCliEntry) {
  server.listen(port, host, () => {
    console.log(`Deburapy running at http://${host}:${port}`);
  });
}
