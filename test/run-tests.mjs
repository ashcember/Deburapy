import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildChatCompletionsRequest } from "../src/core/openai-compatible.mjs";

const prompt = await readFile(new URL("../prompts/deburapy-mediator.system.md", import.meta.url), "utf8");

assert.match(prompt, /not a therapist/i);
assert.match(prompt, /AI-human relationship/i);
assert.match(prompt, /人机关系协调员/);
assert.doesNotMatch(prompt, /single named deployment/i);
assert.doesNotMatch(prompt, /private chat platform/i);

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

console.log("Deburapy tests passed.");
