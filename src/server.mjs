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
  buildCompanionUserPrompt
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

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, status, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": contentType });
  res.end(text);
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
    const room = store.getRoom(roomId);
    const content = String(input.content || [
      "Deburapy turn request for the external AI companion.",
      "",
      "Please read the current room context and reply as the configured AI companion.",
      "After replying, Deburapy will return the turn to the mediator.",
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
  try {
    const { url } = routeParts(req);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res);
    if (serveStatic(req, res, url.pathname)) return;
    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    if (err instanceof BadRequestError) {
      return sendJson(res, 400, { error: err.message });
    }
    sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(port, host, () => {
  console.log(`Deburapy running at http://${host}:${port}`);
});
