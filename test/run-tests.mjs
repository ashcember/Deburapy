import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildChatCompletionsRequest, providerDefaults } from "../src/core/openai-compatible.mjs";
import { buildMediatorUserPrompt, buildCompanionUserPrompt, defaultCompanionPrompt } from "../src/core/prompt.mjs";

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
assert.doesNotMatch(appJs, /JSON\.stringify\(config\(\)\)/);
assert.match(indexHtml, /id="companionMode"/);
assert.match(indexHtml, /id="testCompanion"/);
assert.match(indexHtml, /id="settingsDrawer"/);
assert.match(indexHtml, /id="sessionDuration"/);
assert.match(indexHtml, /id="turnBadge"/);
assert.match(indexHtml, /id="companionApiSettings"/);
assert.match(indexHtml, /id="companionMcpGuide"/);
assert.doesNotMatch(indexHtml, /id="authorRole"/);
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
