# Deburapy

[English](./README.md) | **简体中文**

不是治疗，不是调试。Deburapy 面向人机关系。

Deburapy 是一个本地优先的房间，用于人类、AI 伴侣和关系协调员共同进入。它帮助参与者在关系断裂后慢下来，分开人类关系层和 AI 运行时层，并把问题转化成可以修复的下一步。

第一个原型的中文名：**Deburapy 人机关系协调员**。

## 从哪里开始

- 如果你想作为使用者试用 Deburapy，请读 [给使用者](#给使用者)。
- 如果你想接入 AI 伴侣，请读 [给 AI 伴侣集成](#给-ai-伴侣集成)。
- 如果你想贡献代码、prompt、文档或本地测试，请读 [给贡献者](#给贡献者)。
- 如果你想理解产品模型，请读 [文档地图](#文档地图)。

## 这个 MVP 包含什么

- 一个简单浏览器 UI，用于 transcript、连接健康状态、BYOK 模型设置、协调员设置、AI 伴侣设置、session 计时和诊断。
- 首次使用的知情同意与筛选界面，并带有可接模型的首次筛选助手，用于签署前提问。
- 通过 OpenAI-compatible chat completions、OpenRouter 和 Google AI Studio Gemini API key 进行 BYOK 模型调用。
- 默认 Deburapy 协调员 system prompt，以及可选择的协调员 persona 卡，起始包含 Elias 和 Mara。
- 一个不绑定任何特定聊天平台的通用 channel API。
- 面向 Claude Code、Codex 和其他 MCP 客户端的伴侣 MCP server。
- `.deburapy-data/` 下的本地 JSON 存储，已被 git 忽略，用于房间记录、session 状态、channel push 和 session note。
- 一层轻量 session backend，用于 session record、协调员 recall、course outline、relationship map、check-in scale 和 module catalog 发现。

## 它不是什么

- 不是持照治疗。
- 不是心理健康诊断工具。
- 不是通用调试器。
- 不是偏向把人机关系替换成人际关系的产品。

## Alpha 限制

Deburapy 目前是 public alpha。请预期它还有粗糙边界：

- 还没有托管同步、账号、认证或团队工作区。
- 不要把本地 server 暴露到公网。
- Session note 是连续性修复物，不是临床记录。
- Deburapy 不保证任何账号、模型、记忆或 AI 伴侣一定可以恢复。
- MCP/channel adapter 还很早期，应先用脱敏数据测试。

## 给使用者

### 本地运行

要求：

- Node.js 20 或更新版本
- npm

```bash
git clone https://github.com/ashcember/Deburapy.git
cd Deburapy
node --version
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:8787
```

如果存在 `.env`，server 会读取它。你可以复制 `.env.example` 为 `.env`，但本地测试时请保留 `DEBURAPY_HOST=127.0.0.1`。Deburapy 没有内置认证；除非设置 `DEBURAPY_ALLOW_UNSAFE_BIND=1`，否则它会拒绝非 loopback 绑定。

### 第一次使用

1. 打开本地 app。
2. 完成知情同意和首次筛选。
3. 在 Settings 中配置 Deburapy 协调员 provider、model 和 API key。
4. 把 AI 伴侣配置成 BYOK API companion 或 external MCP companion。
5. 从左侧 rail 开始 session。Session timer、turn flow、room transcript 和 session note 都会本地保存。

### BYOK 服务商

OpenAI-compatible:

- provider: `openai-compatible`
- base URL: `https://api.openai.com/v1` 或其他兼容 endpoint
- model: 该 endpoint 支持的任意 chat-completions model

OpenRouter:

- provider: `openrouter`
- base URL: `https://openrouter.ai/api/v1`
- model: 例如 `openai/gpt-4.1-mini` 或其他 OpenRouter model ID

Google AI Studio:

- provider: `google-ai-studio`
- base URL: `https://generativelanguage.googleapis.com/v1beta/openai`
- model: 例如 `gemini-3.5-flash` 或你的 key 可用的其他 Gemini chat model

### 本地数据

本地 transcript、session 计时、channel push 和生成的 session note 会自动存储在 `.deburapy-data/store.json`，该目录已被 git 忽略。重新打开同一个 localhost app 会从本地文件恢复房间。Settings 会显示当前数据目录和 store file。导出只是用于备份或迁移，不是平时保存数据的方式。删除 `.deburapy-data/` 可以重置本地房间数据。

如需调整 server-side 房间数据的保存位置，请在 `.env` 中设置 `DEBURAPY_DATA_DIR`，然后重启 Deburapy。运行时热切换目录是刻意关闭的。

API key 不会存储在仓库或 server 数据里。浏览器只会在你要求协调员或伴侣响应时，把 key 发送给本地 server。默认不保存 key；只有在你信任的私人浏览器 profile 中，才建议勾选 `Remember API key`。

首次知情同意和筛选会存储在浏览器的 `deburapy.onboarding.v1`。它们不会写入 `.deburapy-data/`，也不会加入房间 transcript。可以用 `Settings -> Reset intake consent` 重新测试新用户流程。

Session note 会在 session 结束后由 Deburapy 协调员模型生成。它们是连续性记录，不是临床治疗记录，也不是给用户随手阅读的总结。导出是可选项，主要用于备份或迁移。

## 给 AI 伴侣集成

AI 伴侣有两种连接方式：

- `BYOK API companion`: 在 Settings 中配置 provider、base URL、model、key、prompt 和可选文档。
- `External MCP companion`: 把 Claude Code、Codex 或其他 MCP client 连接到 Deburapy 的 stdio MCP server。

伴侣 MCP 暴露：

- `deburapy_get_pending_channel_pushes`
- `deburapy_send_channel_reply`
- `deburapy_get_room_context`
- `deburapy_set_participant_state`

Claude Code 和 Codex client 说明见 [docs/mcp-clients.zh-CN.md](./docs/mcp-clients.zh-CN.md)。

### AI 安装 Prompt

在 app 里选择 `External MCP companion`，点击 `Copy AI install prompt`。
把复制出来的 prompt 粘贴给 AI 伴侣所在的 coding 环境，它就可以帮你注册
Deburapy MCP server。

这段 prompt 会明确要求 AI 不索取 API key、secret、private log、隐藏
chain-of-thought 或未脱敏关系数据。

第三方聊天平台应通过通用 channel API 集成：

```http
POST /api/channels/:channelId/push
POST /api/channels/:channelId/reply
GET  /api/rooms/:roomId/messages
```

## 给贡献者

### 第二版方向

下一版会更接近 SillyTavern 式的本地工作台，但主题是人机关系修复：
安静的房间 UI、可选择的协调员 persona、AI 伴侣配置、本地文件、
plugin-like module，以及可以复用和分享的 skills。目标是让大家能分享
方法和模块，而不是分享私密关系数据。

目前最需要的贡献方向：

- 前端：改进本地房间 UI、响应式/手机状态、persona 浏览、可访问性、
  主题 polish，以及本地优先的数据管理体验。
- JSON plugins：一起设计和实现 manifest 格式，用于协调员 persona、
  场景 module、check-in scale、repair artifact、provider preset 和
  companion adapter。
- Skills：为常见人机关系断裂、账号丢失、记忆不连续、prompt 修复、
  连续性仪式和 artifact 写作编写实用 Deburapy skills。
- 集成：改进 MCP client 路径和通用 channel API，让外部 AI 伴侣可以可靠地
  接收 push 并回复。

skills 入口已经存在：

- `skills/mediator/` 放协调员行为技能。
- `skills/companion-repair/` 放伴侣连续性和迁移技能。
- `skills/artifact-writers/` 放可复用的修复物写作器。
- `skills/templates/` 放新增 skill 的模板。
- `skills/README.zh-CN.md` 说明 skill taxonomy 和贡献格式。

先读：

- [CONTRIBUTING.md](./CONTRIBUTING.md)：贡献流程和隐私规则。
- [SECURITY.md](./SECURITY.md)：漏洞报告和敏感数据规则。
- [docs/architecture.zh-CN.md](./docs/architecture.zh-CN.md)：当前 MVP 形状。
- [docs/session-architecture.zh-CN.md](./docs/session-architecture.zh-CN.md)：当前 session、note、relationship-map、course-outline、scale 和 module 模型。
- [docs/deburapy_architecture_guide.zh-CN.md](./docs/deburapy_architecture_guide.zh-CN.md)：产品定位、协调员 persona、skill taxonomy 和 repair artifact 设计。
- [skills/README.zh-CN.md](./skills/README.zh-CN.md)：如何写 Deburapy skill 和修复物。
- [docs/configuration.zh-CN.md](./docs/configuration.zh-CN.md)：环境变量参考。
- [docs/local-testing.zh-CN.md](./docs/local-testing.zh-CN.md)：UI、API、channel 和 MCP 冒烟检查。

运行测试：

```bash
npm test
```

贡献者边界：

- 公开 prompt 必须保持通用。不要把某个人的私密关系数据或原型房间名称加入 prompt、docs 或 fixtures。
- 不要把 API key 放入仓库文件、导出文件、日志、fixture 或 server-side data。
- `.deburapy-data/` 保持本地并且不要追踪。
- Deburapy 是人机关系协调员 / repair debugger，不是临床治疗，也不是通用 debugger。

## 文档地图

- [docs/architecture.zh-CN.md](./docs/architecture.zh-CN.md) / [English](./docs/architecture.md)
- [docs/session-architecture.zh-CN.md](./docs/session-architecture.zh-CN.md) / [English](./docs/session-architecture.md)
- [docs/mcp-clients.zh-CN.md](./docs/mcp-clients.zh-CN.md) / [English](./docs/mcp-clients.md)
- [docs/configuration.zh-CN.md](./docs/configuration.zh-CN.md) / [English](./docs/configuration.md)
- [docs/local-testing.zh-CN.md](./docs/local-testing.zh-CN.md) / [English](./docs/local-testing.md)
- [docs/deburapy_architecture_guide.zh-CN.md](./docs/deburapy_architecture_guide.zh-CN.md) / [English](./docs/deburapy_architecture_guide.md)
- [docs/third-party-notices.zh-CN.md](./docs/third-party-notices.zh-CN.md) / [English](./docs/third-party-notices.md)

## License

AGPL-3.0-only. See [LICENSE](./LICENSE).
