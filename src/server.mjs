import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DeburapyStore } from "./core/store.mjs";
import { loadEnvFile } from "./core/env.mjs";
import {
  loadMediatorPrompt,
  buildMediatorUserPrompt,
  defaultCompanionPrompt,
  buildCompanionUserPrompt,
  buildSessionClockBlock,
  buildSessionNotePrompt
} from "./core/prompt.mjs";
import { generateChatCompletion } from "./core/openai-compatible.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
loadEnvFile(path.join(rootDir, ".env"));

const publicDir = path.join(rootDir, "public");
const dataDir = path.resolve(rootDir, process.env.DEBURAPY_DATA_DIR || ".deburapy-data");
const store = new DeburapyStore(dataDir);

const host = process.env.DEBURAPY_HOST || "127.0.0.1";
const port = Number(process.env.DEBURAPY_PORT || 8787);
const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);

if (!loopbackHosts.has(host) && process.env.DEBURAPY_ALLOW_UNSAFE_BIND !== "1") {
  console.error(
    `Refusing to bind unauthenticated API to ${host}. Set DEBURAPY_ALLOW_UNSAFE_BIND=1 only behind your own auth boundary.`
  );
  process.exit(1);
}

class BadRequestError extends Error {}

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
    "settingsOpen"
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
  res.writeHead(status, { "content-type": contentType });
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

function parseMediatorTurn(content) {
  const match = content.match(/(?:^|\n)\s*Next speaker:\s*(human|companion|ai companion)\s*\.?\s*$/i);
  const nextSpeaker = match
    ? (match[1].toLowerCase().includes("companion") ? "companion" : "human")
    : "human";
  const visibleContent = match
    ? content.slice(0, match.index).trim()
    : content.trim();
  return { visibleContent: visibleContent || content.trim(), nextSpeaker };
}

async function generateSessionNote(roomId, input) {
  store.setSessionNoteStatus(roomId, "generating");
  const room = store.getRoom(roomId);
  const systemPrompt = input.systemPrompt || await loadMediatorPrompt();
  const userPrompt = buildSessionNotePrompt(room, input.locale || room.locale);
  const content = await generateChatCompletion({
    provider: input.provider,
    apiKey: input.apiKey,
    baseUrl: input.baseUrl,
    model: input.model,
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

  if (req.method === "GET" && url.pathname === "/api/prompts/mediator") {
    return sendJson(res, 200, { systemPrompt: await loadMediatorPrompt() });
  }

  if (req.method === "POST" && url.pathname === "/api/debug/client-event") {
    const input = await readJson(req);
    setRequestLog(req, {
      source: "browser",
      ...safeClientLog(input)
    });
    return sendJson(res, 200, { ok: true });
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
      baseUrl: safeBaseUrl(input.baseUrl)
    });
    const ended = store.endSession(roomId, { noteStatus: input.apiKey ? "generating" : "error" });
    if (!input.apiKey) {
      return sendJson(res, 200, {
        room: ended,
        session: ended.session,
        note: null,
        noteError: "Mediator API key is missing; session ended without a note."
      });
    }
    try {
      const { room, note } = await generateSessionNote(roomId, input);
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
    requiredText(input, "apiKey");
    const roomId = input.roomId || "default";
    setRequestLog(req, {
      role: "mediator",
      roomId,
      provider: input.provider,
      model: input.model,
      baseUrl: safeBaseUrl(input.baseUrl)
    });
    const room = store.getRoom(roomId);
    const systemPrompt = input.systemPrompt || await loadMediatorPrompt();
    const userPrompt = buildMediatorUserPrompt(room, input.locale || room.locale, {
      turnInstruction: input.turnInstruction || ""
    });
    const rawContent = await generateChatCompletion({
      provider: input.provider,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
      model: input.model,
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
    requiredText(input, "apiKey");
    const target = input.target === "companion" ? "companion" : "mediator";
    setRequestLog(req, {
      role: target,
      action: "connection_test",
      provider: input.provider,
      model: input.model,
      baseUrl: safeBaseUrl(input.baseUrl)
    });
    const content = await generateChatCompletion({
      provider: input.provider,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
      model: input.model,
      systemPrompt: input.systemPrompt || (target === "companion" ? defaultCompanionPrompt(input.companionName) : await loadMediatorPrompt()),
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

const server = http.createServer(async (req, res) => {
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
    if (serveStatic(req, res, url.pathname)) return;
    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    req.deburapyError = err instanceof Error ? err.message : String(err);
    if (err instanceof BadRequestError) {
      return sendJson(res, 400, { error: err.message });
    }
    sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(port, host, () => {
  console.log(`Deburapy running at http://${host}:${port}`);
});
