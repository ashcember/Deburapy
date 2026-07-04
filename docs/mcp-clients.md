# MCP Client Notes

## Claude Code

Deburapy can expose standard MCP tools and can optionally emit a Claude
Code-specific channel notification:

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
`DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS=1`.

## Codex

The Codex-safe path is tool-based:

- call `deburapy_get_pending_channel_pushes`
- inspect context with `deburapy_get_room_context`
- reply through `deburapy_send_channel_reply`

Do not assume Codex supports the same Claude-specific notification method.
