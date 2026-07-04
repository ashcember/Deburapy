# 配置

[English](./configuration.md)

如果项目根目录存在 `.env`，Deburapy 会读取它。Shell 中已经设置的环境变量优先于 `.env`。

除非你已经把 Deburapy 放在自己的认证边界后面，否则请保留
`DEBURAPY_HOST=127.0.0.1`。本地 server 没有内置认证。

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `DEBURAPY_HOST` | `127.0.0.1` | 本地 web server 和 JSON API 的 host。除非显式允许 unsafe bind，否则会拒绝非 loopback host。 |
| `DEBURAPY_PORT` | `8787` | 本地 web server 和 JSON API 的端口。 |
| `DEBURAPY_DATA_DIR` | `.deburapy-data` | 本地数据目录，用于 `store.json`，包括房间 transcript、session record、channel push 和 session note。 |
| `DEBURAPY_ALLOW_UNSAFE_BIND` | `0` | 只有在你自己提供认证和网络边界时才设为 `1`，允许绑定到 loopback 之外。 |
| `DEBURAPY_URL` | `http://127.0.0.1:8787` | stdio MCP server 调用本地 Deburapy API 时使用的 base URL。 |
| `DEBURAPY_ROOM_ID` | `default` | MCP tool 在调用者没有传 room ID 时使用的默认房间。 |
| `DEBURAPY_PARTICIPANT_ID` | `companion` | MCP pending-push polling 使用的默认参与者 ID。 |
| `DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS` | `0` | 设为 `1` 可启用 MCP server 中可选的 Claude Code channel notification bridge。 |
| `DEBURAPY_POLL_MS` | `3000` | 可选 Claude Code channel notification 的轮询间隔，单位毫秒。 |
