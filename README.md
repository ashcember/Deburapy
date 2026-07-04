# Deburapy

Not therapy, not debugging. Deburapy for AI-human relationships.

Deburapy is a local-first room for a human, an AI companion, and a relationship
mediator. It helps the participants slow down a rupture, inspect where the
human relationship layer and the AI runtime layer are getting tangled, and turn
that into a repairable next step.

Chinese name for the first prototype: **Deburapy 人机关系协调员**.

## What This MVP Includes

- A simple browser UI inspired by character-chat tools: transcript, participant
  controls, BYOK model settings, mediator prompt viewer, and channel push
  simulator.
- BYOK model calls through OpenAI-compatible chat completions and OpenRouter.
- A default Deburapy mediator system prompt with English and Simplified Chinese
  behavior guidance.
- A generic channel API, not tied to any one chat platform.
- A companion MCP server for Claude Code, Codex, and other MCP clients.
- Local JSON storage under `.deburapy-data/`, ignored by git.

## What It Is Not

- Not licensed therapy.
- Not a mental health diagnosis tool.
- Not a general-purpose debugger.
- Not biased toward replacing an AI-human relationship with a human-human
  relationship.

## Run Locally

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:8787
```

No API key is stored in the repository. The browser keeps your BYOK settings in
local storage and sends the key only to the local server when you ask the
mediator to respond.

## BYOK Providers

### OpenAI-compatible

Use any provider with a `/chat/completions` endpoint:

- provider: `openai-compatible`
- base URL: `https://api.openai.com/v1` or another compatible endpoint
- model: any chat-completions model supported by that endpoint

### OpenRouter

- provider: `openrouter`
- base URL: `https://openrouter.ai/api/v1`
- model: for example `openai/gpt-4.1-mini` or another OpenRouter model ID

## Generic Channel API

Third-party channels should push messages into Deburapy through the generic
API. Platform adapters can be added later without changing the room model.

```http
POST /api/channels/:channelId/push
POST /api/channels/:channelId/reply
GET  /api/rooms/:roomId/messages
```

## Companion MCP

Start the MCP server:

```bash
DEBURAPY_URL=http://127.0.0.1:8787 npm run mcp
```

Tools exposed:

- `deburapy_get_pending_channel_pushes`
- `deburapy_send_channel_reply`
- `deburapy_get_room_context`
- `deburapy_set_participant_state`

Claude Code can additionally receive channel wake-ups through the experimental
`notifications/claude/channel` path when:

```bash
DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS=1 npm run mcp
```

Codex support is implemented through MCP tools first. Deburapy does not assume
Codex has the same host-specific channel notification extension as Claude Code.

## Tests

```bash
npm test
```

The tests verify that the public mediator prompt stays generic and that the
provider payload builder keeps API keys out of request bodies.

## License

AGPL-3.0-only. See [LICENSE](./LICENSE).
