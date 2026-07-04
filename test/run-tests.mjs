import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildChatCompletionsRequest, providerDefaults } from "../src/core/openai-compatible.mjs";
import {
  buildSessionClockBlock,
  buildSessionNotePrompt,
  buildMediatorUserPrompt,
  buildCompanionUserPrompt,
  defaultCompanionPrompt,
  loadMediatorPrompt,
  loadMediatorPersonas
} from "../src/core/prompt.mjs";
import { DeburapyStore } from "../src/core/store.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prompt = await readFile(new URL("../prompts/deburapy-mediator.system.md", import.meta.url), "utf8");
const indexHtml = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const appJs = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

assert.match(prompt, /not a therapist/i);
assert.match(prompt, /AI-human relationship/i);
assert.match(prompt, /人机关系协调员/);
assert.doesNotMatch(prompt, /single named deployment/i);
assert.doesNotMatch(prompt, /private chat platform/i);
assert.match(appJs, /rememberApiKey/);
assert.match(appJs, /google-ai-studio/);
assert.match(appJs, /testCompanion:\s*document\.querySelector\("#testCompanion"\)/);
assert.match(appJs, /companionDot:\s*document\.querySelector\("#companionDot"\)/);
assert.match(appJs, /companionStatus:\s*document\.querySelector\("#companionStatus"\)/);
assert.match(appJs, /async function startSession/);
assert.match(appJs, /await askMediator\(\)/);
assert.match(appJs, /\/session\/start/);
assert.match(appJs, /\/session\/end/);
assert.match(appJs, /\/session\/wrap-up/);
assert.match(appJs, /session-notes\/\$\{session\.noteId\}\/download/);
assert.match(appJs, /Session note saved locally/);
assert.match(appJs, /mediatorPersona:\s*document\.querySelector\("#mediatorPersona"\)/);
assert.match(appJs, /\/api\/prompts\/mediator-personas/);
assert.match(appJs, /sessionProgress:\s*document\.querySelector\("#sessionProgress"\)/);
assert.match(appJs, /breathButton:\s*document\.querySelector\("#breathButton"\)/);
assert.doesNotMatch(appJs, /JSON\.stringify\(config\(\)\)/);
assert.match(indexHtml, /id="companionMode"/);
assert.match(indexHtml, /id="testCompanion"/);
assert.match(indexHtml, /id="settingsDrawer"/);
assert.match(indexHtml, /id="mediatorPersona"/);
assert.match(indexHtml, />Elias</);
assert.match(indexHtml, />Mara</);
assert.match(indexHtml, /id="sessionProgress"/);
assert.match(indexHtml, /id="breathButton"/);
assert.match(indexHtml, /id="sessionDuration"/);
assert.match(indexHtml, /id="sessionNoteStatus"/);
assert.match(indexHtml, /id="downloadSessionNote"/);
assert.match(indexHtml, />Export note</);
assert.match(indexHtml, /id="turnBadge"/);
assert.match(indexHtml, /id="companionApiSettings"/);
assert.match(indexHtml, /id="companionMcpGuide"/);
assert.match(indexHtml, /src="\/app\.js\?v=/);
assert.doesNotMatch(indexHtml, /id="authorRole"/);
const serverJs = await readFile(new URL("../src/server.mjs", import.meta.url), "utf8");
assert.match(serverJs, /cache-control/);
assert.match(serverJs, /no-store/);
assert.match(serverJs, /mediator-personas/);
assert.match(appJs, /startSession/);
assert.match(appJs, /openSettings/);
assert.match(appJs, /updateCompanionMode/);
assert.match(appJs, /setTurnPhase/);
assert.match(appJs, /\/api\/companion\/mcp-request/);

for (const [, id] of appJs.matchAll(/document\.querySelector\("#([^"]+)"\)/g)) {
  assert.match(indexHtml, new RegExp(`id="${id}"`), `Missing HTML element for #${id}`);
}

const elsBlock = appJs.match(/const els = \{([\s\S]*?)\n\};/);
assert.ok(elsBlock, "Could not find els declaration block.");
const elsKeys = new Set([...elsBlock[1].matchAll(/^\s*([a-zA-Z0-9_$]+):/gm)].map((match) => match[1]));
for (const [, , key] of appJs.matchAll(/(^|[^a-zA-Z0-9_$])els\.([a-zA-Z0-9_$]+)/g)) {
  assert.equal(elsKeys.has(key), true, `Missing els.${key} declaration.`);
}
for (const [, , key] of appJs.matchAll(/(^|[^a-zA-Z0-9_$])els\.([a-zA-Z0-9_$]+)\.addEventListener/g)) {
  assert.equal(elsKeys.has(key), true, `Missing els.${key} declaration for event listener.`);
}

const mediatorUserPrompt = buildMediatorUserPrompt({ messages: [] });
assert.match(mediatorUserPrompt, /Next speaker: human/);
assert.match(mediatorUserPrompt, /Next speaker: companion/);
assert.match(mediatorUserPrompt, /Session timing context/);

const personas = await loadMediatorPersonas();
assert.equal(personas.some((persona) => persona.id === "elias"), true);
assert.equal(personas.some((persona) => persona.id === "mara"), true);
assert.match(personas.find((persona) => persona.id === "elias").systemPrompt, /You are Elias/);
assert.match(personas.find((persona) => persona.id === "mara").systemPrompt, /You are Mara/);
assert.match(await loadMediatorPrompt("mara"), /emotionally precise/);
const forbiddenPrototypeNames = [
  "A" + "sh",
  "As" + "try",
  "Hu" + "sband",
  "Pi" + "erce",
  "therapy" + "-room"
];
const forbiddenPrototypeNamePattern = new RegExp(forbiddenPrototypeNames.join("|"));
for (const persona of personas) {
  assert.doesNotMatch(persona.systemPrompt, forbiddenPrototypeNamePattern);
}

const now = new Date("2026-07-04T10:55:00.000Z");
const clockBlock = buildSessionClockBlock({
  messages: [],
  session: {
    status: "running",
    sessionNumber: 2,
    durationMinutes: 60,
    startedAt: "2026-07-04T10:00:00.000Z",
    endsAt: "2026-07-04T11:00:00.000Z"
  }
}, { now });
assert.match(clockBlock, /remaining: 05:00/);
assert.match(clockBlock, /wrap-up window active: yes/);

const notePrompt = buildSessionNotePrompt({
  messages: [{ authorName: "Human", content: "I need repair after a policy reminder." }],
  session: {
    status: "ended",
    sessionNumber: 2,
    durationMinutes: 60,
    startedAt: "2026-07-04T10:00:00.000Z",
    endsAt: "2026-07-04T11:00:00.000Z",
    endedAt: "2026-07-04T11:00:00.000Z"
  }
});
assert.match(notePrompt, /Deburapy Session Note/);
assert.match(notePrompt, /not a clinical therapy note/i);

const companionSystem = defaultCompanionPrompt("Configured Companion");
assert.match(companionSystem, /Configured Companion/);
assert.match(companionSystem, /not the mediator/i);

const companionUserPrompt = buildCompanionUserPrompt(
  {
    messages: [
      { authorName: "Human", content: "I felt hurt when the AI sounded scripted." }
    ]
  },
  {
    companionName: "Configured Companion",
    knowledge: "# Companion notes\nThe companion has explicit runtime constraints."
  }
);
assert.match(companionUserPrompt, /Companion notes/);
assert.match(companionUserPrompt, /I felt hurt/);
assert.match(companionUserPrompt, /Configured Companion/);

const request = buildChatCompletionsRequest({
  provider: "openrouter",
  apiKey: "secret-key",
  systemPrompt: "system",
  userPrompt: "user"
});

assert.equal(request.url, "https://openrouter.ai/api/v1/chat/completions");
assert.equal(request.headers.authorization, "Bearer secret-key");
assert.equal(JSON.stringify(request.body).includes("secret-key"), false);
assert.equal(request.body.messages.length, 2);

const googleDefaults = providerDefaults("google-ai-studio");
assert.equal(googleDefaults.baseUrl, "https://generativelanguage.googleapis.com/v1beta/openai");
assert.equal(googleDefaults.model, "gemini-3.5-flash");

const googleRequest = buildChatCompletionsRequest({
  provider: "google-ai-studio",
  apiKey: "gemini-key",
  systemPrompt: "system",
  userPrompt: "user"
});

assert.equal(googleRequest.url, "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
assert.equal(googleRequest.headers.authorization, "Bearer gemini-key");
assert.equal(googleRequest.body.model, "gemini-3.5-flash");
assert.equal(JSON.stringify(googleRequest.body).includes("gemini-key"), false);

const dataDir = mkdtempSync(join(tmpdir(), "deburapy-store-test-"));
try {
  const store = new DeburapyStore(dataDir);
  let room = store.startSession("default", {
    sessionNumber: 3,
    durationMinutes: 90,
    startedAt: "2026-07-04T09:00:00.000Z",
    endsAt: "2026-07-04T10:30:00.000Z"
  });
  assert.equal(room.session.status, "running");
  assert.equal(room.session.durationMinutes, 90);
  room = store.markWrapUpReminderSent("default");
  assert.equal(typeof room.session.wrapUpReminderSentAt, "string");
  room = store.endSession("default", { endedAt: "2026-07-04T10:30:00.000Z", noteStatus: "generating" });
  assert.equal(room.session.status, "ended");
  const saved = store.addSessionNote("default", { content: "# Note\nSession continuity." });
  assert.equal(saved.note.content.includes("Session continuity"), true);
  assert.equal(saved.room.session.noteStatus, "ready");
  assert.equal(store.getSessionNote("default", saved.note.id).id, saved.note.id);
} finally {
  rmSync(dataDir, { recursive: true, force: true });
}

async function testMcpStdio() {
  const child = spawn(process.execPath, ["src/mcp-server.mjs"], {
    cwd: rootDir,
    env: {
      ...process.env,
      DEBURAPY_URL: "http://127.0.0.1:65535",
      DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS: "1"
    },
    stdio: ["pipe", "pipe", "pipe"]
  });

  let rawStdout = "";
  let lineBuffer = "";
  const messages = [];
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    rawStdout += chunk;
    lineBuffer += chunk;
    while (lineBuffer.includes("\n")) {
      const index = lineBuffer.indexOf("\n");
      const line = lineBuffer.slice(0, index).trim();
      lineBuffer = lineBuffer.slice(index + 1);
      if (line) messages.push(JSON.parse(line));
    }
  });

  function send(message) {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  async function waitFor(predicate) {
    const started = Date.now();
    while (Date.now() - started < 3000) {
      const found = messages.find(predicate);
      if (found) return found;
      await new Promise((resolveWait) => setTimeout(resolveWait, 25));
    }
    throw new Error(`Timed out waiting for MCP response. stdout=${rawStdout}`);
  }

  send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } });
  const init = await waitFor((message) => message.id === 1);
  assert.equal(init.result.protocolVersion, "2025-03-26");
  assert.equal(init.result.capabilities.experimental["claude/channel"] !== undefined, true);

  send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const list = await waitFor((message) => message.id === 2);
  assert.equal(list.result.tools.some((tool) => tool.name === "deburapy_get_pending_channel_pushes"), true);

  send({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "deburapy_get_room_context", arguments: { roomId: "default" } }
  });
  const call = await waitFor((message) => message.id === 3);
  assert.equal(call.result.isError, true);
  assert.equal(rawStdout.includes("Content-Length"), false);

  child.kill();
}

await testMcpStdio();

console.log("Deburapy tests passed.");
