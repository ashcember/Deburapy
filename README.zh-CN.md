# Deburapy

[English](./README.md) | **简体中文**

不是治疗，不是调试。Deburapy 面向人机关系。

Deburapy 是一个本地优先的房间，用于人类、AI 伴侣和关系协调员共同进入。它帮助参与者在关系断裂后慢下来，看清人类关系层和 AI 运行时层在哪里纠缠，并把问题转化成可以修复的下一步。

第一个原型的中文名：**Deburapy 人机关系协调员**。

## 这个 MVP 包含什么

- 一个受角色聊天工具启发的简单浏览器界面：对话记录、连接健康状态、BYOK 模型设置、协调员设置、AI 伴侣设置和诊断。
- 首次使用的知情同意与筛选界面，并带有可接模型的首次筛选助手，用于签署前提问。
- 通过 OpenAI-compatible chat completions、OpenRouter 和 Google AI Studio Gemini API key 进行 BYOK 模型调用。
- 默认 Deburapy 协调员 system prompt，以及可选择的协调员 persona 卡，起始包含 Elias 和 Mara。
- 一个不绑定任何特定聊天平台的通用 channel API。
- 面向 Claude Code、Codex 和其他 MCP 客户端的伴侣 MCP server。
- `.deburapy-data/` 下的本地 JSON 存储，已被 git 忽略，用于房间记录、session 状态、channel push 和 session note。

## 它不是什么

- 不是持照治疗。
- 不是心理健康诊断工具。
- 不是通用调试器。
- 不是偏向把人机关系替换成人际关系的产品。

## 本地运行

要求：

- Node.js 20 或更新版本
- npm

```bash
git clone https://github.com/ashcember/Deburapy.git
cd Deburapy
node --version
npm run dev
```

打开：

```text
http://127.0.0.1:8787
```

如果存在 `.env`，server 会读取它。你可以复制 `.env.example` 为 `.env`，但本地测试时请保留 `DEBURAPY_HOST=127.0.0.1`。Deburapy 没有内置认证；除非设置 `DEBURAPY_ALLOW_UNSAFE_BIND=1`，否则它会拒绝非 loopback 绑定。

本地 transcript、session 计时、channel push 和生成的 session note 会存储在 `.deburapy-data/store.json`，该目录已被 git 忽略。重新打开同一个 localhost app 会从本地文件恢复房间。删除 `.deburapy-data/` 可以重置本地数据。

API key 不会存储在仓库或 server 数据里。浏览器只会在你要求协调员响应时，把 key 发送给本地 server。默认不保存 key；只有在你信任的私人浏览器 profile 中，才建议勾选 `Remember API key`。

首次知情同意和筛选会存储在浏览器的 `deburapy.onboarding.v1`。它们不会写入 `.deburapy-data/`，也不会加入房间 transcript。可以用 `Settings -> Reset intake consent` 重新测试新用户流程。首次筛选助手只有在你主动提问时才使用 Deburapy provider config；它的回答不会保存到房间里。

## 协调员 Persona

协调员 persona 类似轻量的本地角色卡。在 Settings 中可以选择 `Deburapy Core`、`Elias`、`Mara` 或 `Custom prompt`。选择具名 persona 会把对应 system prompt 加载进协调员 prompt 编辑器。编辑该 prompt 会把选择切换为 `Custom prompt`。所选 persona 和编辑后的 prompt 会保存在浏览器本地配置中。

Persona prompt 文件位于：

```text
prompts/mediator-personas/
```

浏览器通过以下接口加载 persona 目录：

```text
GET /api/prompts/mediator-personas
```

## BYOK 服务商

### OpenAI-compatible

可以使用任何提供 `/chat/completions` endpoint 的服务商：

- provider: `openai-compatible`
- base URL: `https://api.openai.com/v1` 或其他兼容 endpoint
- model: 该 endpoint 支持的任意 chat-completions model

### OpenRouter

- provider: `openrouter`
- base URL: `https://openrouter.ai/api/v1`
- model: 例如 `openai/gpt-4.1-mini` 或其他 OpenRouter model ID

### Google AI Studio

使用 Google AI Studio 的 Gemini API key：

- provider: `google-ai-studio`
- base URL: `https://generativelanguage.googleapis.com/v1beta/openai`
- model: 例如 `gemini-3.5-flash` 或你的 key 可用的其他 Gemini chat model

## UI 冒烟测试

1. 启动 `npm run dev`。
2. 打开 `http://127.0.0.1:8787`。
3. 完成知情同意和首次筛选。如果想先测试首次筛选助手，请从 gate 打开 Settings 并配置 Deburapy provider。
4. 左侧 rail 会自动显示当前 session。只有在你想修改总 session 计划或默认时长时，才需要点击小的 session 设置按钮。
5. 点击右上角 `Settings`。
6. 配置 Deburapy 协调员 provider、base URL、model 和 API key。
7. 配置 AI 伴侣：
   - `BYOK API companion`: 填写 provider/base URL/model/key，并可选填写伴侣 prompt/docs。
   - `External MCP companion`: 不需要填写 API key。按照 Settings 中的 MCP 指引，把外部 Claude/Codex client 连接到 Deburapy 的 MCP server。
8. 点击 `Test mediator` 和 `Test companion`。绿色点表示 endpoint 有响应。MCP companion 模式只验证 bridge 可达；浏览器无法证明外部 Claude/Codex client 已连接。
9. 关闭 settings，在左侧 session rail 点击 `Start`。倒计时开始，server 保存 session 起止时间，Deburapy 自动写第一条协调员消息。
10. Deburapy 会决定下一位发言者。默认把回合交给人类；也可以先把下一轮交给 AI 伴侣。
11. 当回合标记显示 `Next: Human` 时，在底部 composer 输入人类消息。composer 只用于人类。
12. 人类发送后，Deburapy 会把回合转给 AI 伴侣。BYOK API 模式会调用伴侣模型；MCP 模式会为外部 MCP client 排队一个 pending turn。
13. AI 伴侣回复后，回合回到 Deburapy。
14. 倒计时进入最后五分钟时，Deburapy 会标记收尾窗口，并在协调员、API 伴侣和 MCP 伴侣上下文中加入收尾提醒。
15. 点击 `End`，或让计时结束，以生成 session note。该 note 会自动保存进本地房间 store。session 设置中的导出是可选的，主要用于备份或迁移；不建议把 note 当作日常阅读材料。
16. 当 key、model、quota 或连接失败时，使用左侧 footer 的 `Diagnostics` 或 `FAQ`。

## 本地持久化与 Session Notes

原型采用本地优先存储。房间消息、pending channel push、当前 session 计时和生成的 session note 会写入 `.deburapy-data/store.json`。只要不删除该目录，重启 dev server 或重新打开 `http://127.0.0.1:8787` 都会保留房间历史。

导出是方便路径，不是主要保存机制。浏览器可以通过以下接口导出 note：

```text
GET /api/rooms/:roomId/session-notes/:noteId/download
```

Session note 由 Deburapy 协调员模型在 session 结束后生成。note prompt 要求输出简洁的连续性记录，包含 metadata、修复主题、互动模式、AI runtime 或 prompt 限制、干预、约定、未完成线索，以及安全或边界标记。它明确说明这不是临床治疗记录，也不是给用户随手阅读的总结。

## API 冒烟测试

先写入一条人类消息：

```bash
curl -sS -X POST http://127.0.0.1:8787/api/rooms/default/messages \
  -H 'content-type: application/json' \
  --data '{"authorRole":"human","authorName":"Human","content":"We need help slowing down a repeated rupture."}'
```

再用你的 provider config 调用 `/api/mediator/respond`：

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

Google AI Studio 配置示例：

```json
{
  "provider": "google-ai-studio",
  "baseUrl": "https://generativelanguage.googleapis.com/v1beta/openai",
  "model": "gemini-3.5-flash",
  "apiKey": "YOUR_GEMINI_API_KEY"
}
```

AI 伴侣 API 路径与协调员分开：

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

外部 MCP 伴侣不需要 API key，可这样排队一个伴侣回合：

```bash
curl -sS -X POST http://127.0.0.1:8787/api/companion/mcp-request \
  -H 'content-type: application/json' \
  --data '{"roomId":"default"}'
```

## 通用 Channel API

第三方 channel 应通过通用 API 把消息 push 进 Deburapy。以后可以增加平台 adapter，而不改变房间模型。

```http
POST /api/channels/:channelId/push
POST /api/channels/:channelId/reply
GET  /api/rooms/:roomId/messages
```

Channel push 冒烟测试：

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

伴侣 MCP 是 stdio MCP server。不要在普通终端运行 `npm run mcp` 并期待 Claude Code 自动发现它。需要在你的 MCP client 中注册。

对 Claude Code，先启动 web server，然后在 Deburapy repo root 执行：

```bash
claude mcp add --env DEBURAPY_URL=http://127.0.0.1:8787 \
  --transport stdio deburapy \
  -- node "$(pwd)/src/mcp-server.mjs"
```

如果你的 Claude Code build 需要项目配置，请参考 [`examples/claude-code.mcp.example.json`](./examples/claude-code.mcp.example.json)，并替换绝对路径。

在 Claude Code 中用 `/mcp` 或以下命令验证：

```bash
claude mcp get deburapy
```

暴露的工具：

- `deburapy_get_pending_channel_pushes`
- `deburapy_send_channel_reply`
- `deburapy_get_room_context`
- `deburapy_set_participant_state`

Claude Code 还可以通过实验性的 `notifications/claude/channel` 路径接收 channel wake-up：

```bash
claude mcp add --env DEBURAPY_URL=http://127.0.0.1:8787 \
  --env DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS=1 \
  --transport stdio deburapy \
  -- node "$(pwd)/src/mcp-server.mjs"
claude --dangerously-load-development-channels server:deburapy
```

Codex 支持优先通过 MCP tools 实现。Deburapy 不假设 Codex 具有与 Claude Code 相同的 host-specific channel notification extension。

Channel wake-up 路径用于本地开发。如果它没有唤醒伴侣，请先验证标准 MCP tools：

```text
Call deburapy_get_pending_channel_pushes with claim=true, then reply with
deburapy_send_channel_reply.
```

## 规划中的 Session Model

MVP 房间刻意保持很薄。下一层 backend 会增加定时 session、协调员 note、下次 session recall、course outline、pattern review、check-in scale 和场景 module。见 [docs/session-architecture.zh-CN.md](./docs/session-architecture.zh-CN.md)。更大的项目架构和 skill taxonomy 见 [docs/deburapy_architecture_guide.zh-CN.md](./docs/deburapy_architecture_guide.zh-CN.md)。

## 测试

```bash
npm test
```

测试会验证公开协调员 prompt 仍保持通用，并确认 provider payload builder 不会把 API key 放进 request body。

## License

AGPL-3.0-only. See [LICENSE](./LICENSE).
