import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DeburapyStore } from "./core/store.mjs";
import { loadMediatorPrompt, buildMediatorUserPrompt } from "./core/prompt.mjs";
import { generateChatCompletion } from "./core/openai-compatible.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const dataDir = path.resolve(rootDir, process.env.DEBURAPY_DATA_DIR || ".deburapy-data");
const store = new DeburapyStore(dataDir);

const host = process.env.DEBURAPY_HOST || "127.0.0.1";
const port = Number(process.env.DEBURAPY_PORT || 8787);

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
  return JSON.parse(body);
}

function routeParts(req) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  return { url, parts: url.pathname.split("/").filter(Boolean) };
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
    const room = store.addMessage(parts[2] || "default", input);
    return sendJson(res, 201, { room });
  }

  if (req.method === "POST" && url.pathname === "/api/mediator/respond") {
    const input = await readJson(req);
    const roomId = input.roomId || "default";
    const room = store.getRoom(roomId);
    const systemPrompt = input.systemPrompt || await loadMediatorPrompt();
    const userPrompt = buildMediatorUserPrompt(room, input.locale || room.locale);
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
      authorRole: "mediator",
      authorName: "Deburapy",
      content
    });
    return sendJson(res, 200, { message: updated.messages.at(-1), room: updated });
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "channels" && parts[3] === "push") {
    const input = await readJson(req);
    const push = store.addChannelPush(input.roomId || "default", parts[2], input);
    return sendJson(res, 201, { push });
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "channels" && parts[3] === "reply") {
    const input = await readJson(req);
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
    sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(port, host, () => {
  console.log(`Deburapy running at http://${host}:${port}`);
});
