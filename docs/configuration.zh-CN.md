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
| `DEBURAPY_ENABLE_HOSTED_DEMO` | `0` | 设为 `1` 后，协调员和首次筛选助手可以使用 server 端托管的 demo key。 |
| `DEBURAPY_HOSTED_DEMO_GOOGLE_AI_STUDIO_API_KEY` | 空 | Hosted demo 使用的 server-only Google AI Studio key。不要暴露到前端，也不要提交到仓库。 |
| `DEBURAPY_HOSTED_DEMO_MODEL` | `gemini-3.5-flash` | Hosted demo 协调员使用的模型。 |
| `DEBURAPY_HOSTED_DEMO_BASE_URL` | Google AI Studio OpenAI-compatible URL | Hosted demo 协调员使用的 base URL。 |
| `DEBURAPY_HOSTED_DEMO_RATE_LIMIT_PER_MINUTE` | `12` | Hosted demo 的 best-effort 每 IP 内存限流。这不是完整的防滥用系统。 |
| `DEBURAPY_URL` | `http://127.0.0.1:8787` | stdio MCP server 调用本地 Deburapy API 时使用的 base URL。 |
| `DEBURAPY_ROOM_ID` | `default` | MCP tool 在调用者没有传 room ID 时使用的默认房间。 |
| `DEBURAPY_PARTICIPANT_ID` | `companion` | MCP pending-push polling 使用的默认参与者 ID。 |
| `DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS` | `0` | 设为 `1` 可启用 MCP server 中可选的 Claude Code channel notification bridge。 |
| `DEBURAPY_POLL_MS` | `3000` | 可选 Claude Code channel notification 的轮询间隔，单位毫秒。 |

`DEBURAPY_DATA_DIR` 会在 server 启动时读取。如需移动本地房间存储，请在
`.env` 中设置它并重启 Deburapy；Settings 会显示当前解析后的目录和
`store.json` 路径。

## Hosted Demo Key

如果要部署公开 Vercel demo，请设置 `DEBURAPY_ENABLE_HOSTED_DEMO=1`，并把
`DEBURAPY_HOSTED_DEMO_GOOGLE_AI_STUDIO_API_KEY` 放进 Vercel 环境变量。浏览器只会收到
provider、base URL、model 和 “hosted demo key” 标签；不会收到 key 的值。

Hosted demo mode 只开放给 Deburapy 协调员、首次筛选助手、协调员连接测试和
session note 生成。它不会用于 BYOK AI 伴侣 API 调用，这样部署不会变成通用模型代理。
公开展示请使用受限、低额度的 Google AI Studio key；如果要当正式公开服务，还需要更强的
认证和配额控制。

Hosted demo mode 开启后，UI 默认会把协调员 key 显示成不可编辑的 “Demo key managed by host”
状态。用户也可以在 Settings 里切换到自己的 OpenAI-compatible、OpenRouter 或 Google AI Studio
key。如果托管 key 触发服务商 rate limit，Deburapy 会返回 HTTP 429，并提示用户稍等或改用自己的 key。

在 Vercel 上，如果没有设置 `DEBURAPY_DATA_DIR`，server 端房间存储默认会使用
`/tmp/deburapy-data`。这只适合 demo，不是可靠的产品级持久化存储。
