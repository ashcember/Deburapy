# Local Testing

[简体中文](./local-testing.zh-CN.md)

These checks are for contributors and local reviewers. They are intentionally
kept out of the main README so the README can stay useful for users, integrators,
and contributors at a high level.

## UI Smoke Check

1. Start `npm run dev`.
2. Open `http://127.0.0.1:8787`.
3. Complete the informed consent and first screening gate. If you want to test
   the pre-intake assistant first, open Settings from the gate and configure
   the Deburapy provider.
4. The left rail should show the current session automatically. Use the small
   session settings button only if you want to change the total session plan or
   default duration.
5. Click Settings in the top right.
6. Configure the Deburapy mediator provider, base URL, model, and API key.
7. Configure the AI companion:
   - `BYOK API companion`: fill provider, base URL, model, key, and optional companion prompt/docs.
   - `External MCP companion`: do not fill an API key. Follow the MCP guide in Settings and connect an external Claude/Codex client to Deburapy's MCP server.
8. Click `Test mediator` and `Test companion`. A green dot means that endpoint responded. MCP companion mode only verifies that the bridge is reachable; it cannot prove an external Claude/Codex client is connected from the browser.
9. Close settings and click `Start` in the session rail. The countdown should begin, the server should store the session start/end time, and Deburapy should automatically write the first mediator message.
10. Deburapy decides the next speaker. By default it hands the turn to the human; it can also route the next turn to the AI companion first.
11. When the turn badge says `Next: Human`, add a human message in the bottom composer. The composer is human-only.
12. After the human sends, Deburapy routes the turn to the AI companion. In BYOK API mode it calls the companion model; in MCP mode it queues a pending turn for the external MCP client.
13. After the AI companion replies, the turn returns to Deburapy.
14. When the countdown reaches the final five minutes, Deburapy marks the wrap-up window and includes that reminder in mediator, API companion, and MCP companion context.
15. Click `End`, or let the timer expire, to generate a session note. The note is saved into the local room store automatically. Exporting the note from session settings is optional, mainly for backup or transfer; casual reading is not recommended.
16. Use `Diagnostics` or `FAQ` in the left rail footer when a key, model, quota, or connection fails.

## API Smoke Check

Add a human message:

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

For Google AI Studio, switch the provider config:

```json
{
  "provider": "google-ai-studio",
  "baseUrl": "https://generativelanguage.googleapis.com/v1beta/openai",
  "model": "gemini-3.5-flash",
  "apiKey": "YOUR_GEMINI_API_KEY"
}
```

The AI companion API path is separate from the mediator:

```bash
curl -sS -X POST http://127.0.0.1:8787/api/companion/respond \
  -H 'content-type: application/json' \
  --data '{
    "roomId": "default",
    "provider": "google-ai-studio",
    "baseUrl": "https://generativelanguage.googleapis.com/v1beta/openai",
    "model": "gemini-3.5-flash",
    "apiKey": "YOUR_GEMINI_API_KEY",
    "companionName": "AI Companion",
    "systemPrompt": "You are the configured AI companion.",
    "knowledge": "# Companion notes\nRelevant markdown context."
  }'
```

For an external MCP companion, queue a companion turn without any API key:

```bash
curl -sS -X POST http://127.0.0.1:8787/api/companion/mcp-request \
  -H 'content-type: application/json' \
  --data '{"roomId":"default"}'
```

## Channel Push Check

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

## MCP Check

For Claude Code, start the web server first, then run this from the Deburapy
repo root:

```bash
claude mcp add --env DEBURAPY_URL=http://127.0.0.1:8787 \
  --transport stdio deburapy \
  -- node "$(pwd)/src/mcp-server.mjs"
```

If your Claude Code build expects project config instead, copy the shape from
[../examples/claude-code.mcp.example.json](../examples/claude-code.mcp.example.json)
and replace the absolute path.

Verify in Claude Code with `/mcp` or:

```bash
claude mcp get deburapy
```

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

If channel wake-ups do not work, first verify the standard MCP tools:

```text
Call deburapy_get_pending_channel_pushes with claim=true, then reply with
deburapy_send_channel_reply.
```
