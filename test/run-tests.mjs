import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildChatCompletionsRequest } from "../src/core/openai-compatible.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prompt = await readFile(new URL("../prompts/deburapy-mediator.system.md", import.meta.url), "utf8");
const appJs = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

assert.match(prompt, /not a therapist/i);
assert.match(prompt, /AI-human relationship/i);
assert.match(prompt, /人机关系协调员/);
assert.doesNotMatch(prompt, /single named deployment/i);
assert.doesNotMatch(prompt, /private chat platform/i);
assert.match(appJs, /rememberApiKey/);
assert.doesNotMatch(appJs, /JSON\.stringify\(config\(\)\)/);

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
