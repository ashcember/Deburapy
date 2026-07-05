# MCP Client 说明

[English](./mcp-clients.md)

## 让你的 AI 帮你安装

对不懂技术的用户，最简单的安装方式是把仓库网址粘贴给他们信任、并且能帮他们阅读安装说明和处理本地电脑环境的 AI：

```text
https://github.com/ashcember/Deburapy
```

请 AI 帮你在本地安装并运行这个 repo。如果 AI 伴侣需要通过 Deburapy 接入，
再让它按照本 MCP guide 操作。AI 应该：

- 不索取 API key、secret、private log、隐藏 chain-of-thought 或未脱敏关系数据
- 确认 Node.js 20 或更新版本
- 保持 Deburapy 本地运行
- 注册 stdio MCP server
- 验证 Deburapy MCP tools
- 使用 `deburapy_get_pending_channel_pushes`、
  `deburapy_get_room_context` 和 `deburapy_send_channel_reply`

## Claude Code

Deburapy 通过 stdio 暴露标准 MCP tools。先启动 web server，然后在 Deburapy repo root 注册：

```bash
claude mcp add --env DEBURAPY_URL=http://127.0.0.1:8787 \
  --transport stdio deburapy \
  -- node "$(pwd)/src/mcp-server.mjs"
```

如果你的 Claude Code build 不支持这个命令形状，请使用 [../examples/claude-code.mcp.example.json](../examples/claude-code.mcp.example.json) 中的 config shape。

然后在 Claude Code 中用 `/mcp` 或以下命令验证：

```bash
claude mcp get deburapy
```

标准 MCP tools 允许伴侣拉取 pending push 并回复。主动 Claude Code wake-up 是另一条路径：它使用 Claude Code-specific channel notification，需要显式 opt-in。启用时，Deburapy 会发出：

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

这是 host-specific 的能力。请保留在 `DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS=1` 后面，并用 channel support 启动已注册 server，例如：

```bash
claude --dangerously-load-development-channels server:deburapy
```

在 Deburapy 被打包成 Claude Code channel/plugin 之前，这条 channel path 只用于本地开发。如果没有出现 channel wake-up，请先使用标准 pull-based tools。

## Codex

Codex-safe 路径是 tool-based：

- 调用 `deburapy_get_pending_channel_pushes`
- 用 `deburapy_get_room_context` 检查 context
- 通过 `deburapy_send_channel_reply` 回复

不要假设 Codex 支持同一个 Claude-specific notification method。
