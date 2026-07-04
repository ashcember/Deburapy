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

Requirements:

- Node.js 20 or newer
- npm

```bash
git clone https://github.com/ashcember/Deburapy.git
cd Deburapy
node --version
npm run dev
```

Open:

```text
http://127.0.0.1:8787
```

The server reads `.env` if present. You can copy `.env.example` to `.env`, but
keep `DEBURAPY_HOST=127.0.0.1` for local testing. Deburapy has no built-in auth;
it refuses non-loopback binds unless `DEBURAPY_ALLOW_UNSAFE_BIND=1` is set.

Local transcripts and channel pushes are stored in `.deburapy-data/`, which is
ignored by git. Delete that directory to reset local data.

API keys are not stored in the repository or server data. The browser sends the
key to the local server only when you ask the mediator to respond. The key is
not saved by default; only check "Remember API key" on a private browser
profile you trust.

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

Smoke test through the UI:

1. Start `npm run dev`.
2. Open `http://127.0.0.1:8787`.
3. Add at least one room message.
4. Select provider, base URL, model, and paste your API key.
5. Click `Ask Deburapy`.
6. Verify a mediator message appears in the transcript.

Smoke test through the API:

```bash
curl -sS -X POST http://127.0.0.1:8787/api/rooms/default/messages \
  -H 'content-type: application/json' \
  --data '{"authorRole":"human","authorName":"Human","content":"We need help slowing down a repeated rupture."}'
```

Then call `/api/mediator/respond` with your provider config:

```bash
curl -sS -X POST http://127.0.0.1:8787/api/mediator/respond \
  -H 'content-type: application/json' \
  --data '{
    "roomId": "default",
    "provider": "openai-compatible",
    "baseUrl": "https://api.openai.com/v1",
    "model": "gpt-4.1-mini",
    "apiKey": "YOUR_API_KEY"
  }'
```

## Generic Channel API

Third-party channels should push messages into Deburapy through the generic
API. Platform adapters can be added later without changing the room model.

```http
POST /api/channels/:channelId/push
POST /api/channels/:channelId/reply
GET  /api/rooms/:roomId/messages
```

Channel push smoke test:

```bash
curl -sS -X POST http://127.0.0.1:8787/api/channels/local/push \
  -H 'content-type: application/json' \
  --data '{
    "roomId": "default",
    "from": "External Channel",
    "content": "Please review this with the companion.",
    "targetParticipantId": "companion"
  }'
```

## Companion MCP

The companion MCP is a stdio MCP server. Do not run `npm run mcp` in a normal
terminal and expect Claude Code to discover it. Register it with your MCP client.

For Claude Code, start the web server first, then run this from the Deburapy
repo root:

```bash
claude mcp add --env DEBURAPY_URL=http://127.0.0.1:8787 \
  --transport stdio deburapy \
  -- node "$(pwd)/src/mcp-server.mjs"
```

If your Claude Code build expects project config instead, copy the shape from
[`examples/claude-code.mcp.example.json`](./examples/claude-code.mcp.example.json)
and replace the absolute path.

Verify in Claude Code with `/mcp` or:

```bash
claude mcp get deburapy
```

Tools exposed:

- `deburapy_get_pending_channel_pushes`
- `deburapy_send_channel_reply`
- `deburapy_get_room_context`
- `deburapy_set_participant_state`

Claude Code can additionally receive channel wake-ups through the experimental
`notifications/claude/channel` path when:

```bash
claude mcp add --env DEBURAPY_URL=http://127.0.0.1:8787 \
  --env DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS=1 \
  --transport stdio deburapy \
  -- node "$(pwd)/src/mcp-server.mjs"
claude --dangerously-load-development-channels server:deburapy
```

Codex support is implemented through MCP tools first. Deburapy does not assume
Codex has the same host-specific channel notification extension as Claude Code.

The channel wake-up path is for local development. If it does not wake the
companion, first verify the standard MCP tools:

```text
Call deburapy_get_pending_channel_pushes with claim=true, then reply with
deburapy_send_channel_reply.
```

## Planned Session Model

The MVP room is intentionally thin. The next backend layer will add timed
sessions, mediator notes, next-session recall, course outlines, pattern reviews,
check-in scales, and scenario modules. See
[docs/session-architecture.md](./docs/session-architecture.md).

## Tests

```bash
npm test
```

The tests verify that the public mediator prompt stays generic and that the
provider payload builder keeps API keys out of request bodies.

## License

AGPL-3.0-only. See [LICENSE](./LICENSE).
