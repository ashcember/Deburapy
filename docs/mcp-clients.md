# MCP Client Notes

[简体中文](./mcp-clients.zh-CN.md)

## Copy-To-AI Installer Prompt

The app includes a `Copy AI install prompt` button under Settings -> AI
Companion -> External MCP companion. Paste that prompt into the AI companion's
coding environment. It tells the AI to:

- avoid requesting API keys, secrets, private logs, hidden chain-of-thought, or
  unredacted relationship data
- verify Node.js 20 or newer
- keep Deburapy running locally
- register the stdio MCP server
- verify the Deburapy MCP tools
- use `deburapy_get_pending_channel_pushes`,
  `deburapy_get_room_context`, and `deburapy_send_channel_reply`

## Claude Code

Deburapy exposes standard MCP tools over stdio. Register it from the Deburapy
repo root after the web server is running:

```bash
claude mcp add --env DEBURAPY_URL=http://127.0.0.1:8787 \
  --transport stdio deburapy \
  -- node "$(pwd)/src/mcp-server.mjs"
```

If your Claude Code build does not support that command shape, use the config
shape in [../examples/claude-code.mcp.example.json](../examples/claude-code.mcp.example.json).

Then verify from Claude Code with `/mcp` or:

```bash
claude mcp get deburapy
```

Standard MCP tools let the companion pull pending pushes and reply. Active
Claude Code wake-ups are separate: they use a Claude Code-specific channel
notification and require channel opt-in. When enabled, Deburapy emits:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/claude/channel",
  "params": {
    "content": "Batched channel messages...",
    "meta": {
      "channel_name": "example",
      "author": "Human",
      "message_id": "msg_...",
      "is_bot": "false"
    }
  }
}
```

This is host-specific. Keep it behind
`DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS=1`, and start Claude Code with channel
support for the registered server, for example:

```bash
claude --dangerously-load-development-channels server:deburapy
```

The channel path is for local development until Deburapy is packaged as a
Claude Code channel/plugin. If channel wake-ups do not appear, use the standard
pull-based tools first.

## Codex

The Codex-safe path is tool-based:

- call `deburapy_get_pending_channel_pushes`
- inspect context with `deburapy_get_room_context`
- reply through `deburapy_send_channel_reply`

Do not assume Codex supports the same Claude-specific notification method.
