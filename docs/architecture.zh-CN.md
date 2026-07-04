# Deburapy 架构

[English](./architecture.md)

Deburapy 的 MVP 由四个小部件组成。

## 1. 本地 Web App

`src/server.mjs` 从 `public/` 提供静态 UI，并暴露 rooms、messages、mediator generation 和 generic channel pushes 的 JSON API。

## 2. 本地 Store

`src/core/store.mjs` 默认把房间状态写入 `.deburapy-data/store.json`。该目录刻意被 git 忽略，避免本地 transcript、session 计时、channel push 和生成的 session note 进入仓库。重新打开同一个 localhost app 会从该本地文件恢复房间。API key 不会存储在 server 端；只有当浏览器请求模型调用时，才会把 key 发送给本地 server。

## 3. 协调员 Engine

`src/core/openai-compatible.mjs` 为通用 OpenAI-compatible provider、OpenRouter，以及 Google AI Studio 的 Gemini OpenAI compatibility endpoint 构造 OpenAI-compatible chat completion request。API key 只放在 header 中发送，server 不会保存。

协调员和 AI 伴侣是分开的 runtime role：

- `/api/mediator/respond` 使用 Deburapy 协调员 prompt，并写入一条协调员消息。
- `/api/companion/respond` 使用已配置的 AI 伴侣 prompt/documents，并写入一条 AI 伴侣消息。
- `/api/companion/mcp-request` 不需要 BYOK API key，会为外部 MCP 伴侣排队当前房间上下文。
- `/api/prompts/mediator-personas` 返回可选择的本地协调员 persona 卡。MVP 自带 `Deburapy Core`、`Elias` 和 `Mara`；在浏览器中编辑 prompt 会把选择变成自定义本地卡。
- `/api/connections/test` 是浏览器侧模型可达性诊断路径。
- `/api/rooms/:roomId/session/start` 保存 server 端 session 开始/结束计时。
- `/api/rooms/:roomId/session/wrap-up` 标记五分钟收尾提醒已经发送。
- `/api/rooms/:roomId/session/end` 结束 session，并要求协调员模型写一份连续性 note。
- `/api/rooms/:roomId/session-notes/:noteId/download` 将该 note 下载为 markdown。

浏览器 composer 刻意只用于人类。其他两个 role 通过各自配置好的连接发言，而不是通过 role selector。引导回合流程是 Deburapy -> Human -> AI Companion -> Deburapy。当协调员需要 AI 伴侣先提供 runtime 侧说明时，可以选择 `Next speaker: companion`。在浏览器 UI 中，`Start` 会开始 session 倒计时并触发第一条 Deburapy 协调员回复。

Session 计时是 Deburapy、API 伴侣和外部 MCP 伴侣 prompt context 的一部分。当剩余五分钟或更少时，prompt context 会包含收尾提醒，要求收束未完成线索，而不是打开很大的新议题。

原型持久化位于 `.deburapy-data/store.json`。每个房间拥有 messages、pending channel pushes、一个当前 `session` 对象和 `sessionNotes` 数组。Session note 首先用于本地连续性；导出只是可选备份或迁移路径，UI 不把下载描述成保存步骤。

默认 web 布局保持房间简洁：session metadata 和 60/90 分钟倒计时在左侧 rail，连接状态在右上角 compact chip，provider/prompt/document 控制项在 Settings drawer。

## 4. Companion MCP Server

`src/mcp-server.mjs` 暴露一个最小 stdio MCP server。它支持能够调用 tools 的 MCP client，包括 Codex。它也有一个 opt-in Claude Code bridge：当 `DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS=1` 时，它会轮询 pending channel push，并向支持该 Claude-specific extension 的 host 发出 `notifications/claude/channel` 消息。

## Public API Shape

房间模型刻意保持平台中立：

- `room`
- `participant`
- `message`
- `channel_push`
- `participant_state`

聊天平台 adapter 应该把外部消息转换成这个 shape，而不是把平台特定逻辑写进协调员。

参见 [session-architecture.zh-CN.md](./session-architecture.zh-CN.md) 了解规划中的 session、note、relationship-map、course-outline、scale 和 module 模型。参见 [deburapy_architecture_guide.zh-CN.md](./deburapy_architecture_guide.zh-CN.md) 了解更大的产品架构、协调员 persona、skill taxonomy 和 repair artifact 模型。
