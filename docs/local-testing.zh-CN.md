# 本地测试

[English](./local-testing.md)

这些检查面向贡献者和本地 reviewer。它们刻意不放在主 README 里，这样 README 可以保持为使用者、集成者和贡献者都能快速阅读的入口。

## UI 冒烟检查

1. 启动 `npm run dev`。
2. 打开 `http://127.0.0.1:8787`。
3. 完成知情同意和首次筛选。如果想先测试首次筛选助手，请从 gate 打开 Settings 并配置 Deburapy provider。
4. 左侧 rail 应自动显示当前 session。只有在你想修改总 session 计划或默认时长时，才需要点击小的 session 设置按钮。
5. 点击右上角 Settings。
6. 配置 Deburapy 协调员 provider、base URL、model 和 API key。
7. 配置 AI 伴侣：
   - `BYOK API companion`: 填写 provider、base URL、model、key，以及可选伴侣 prompt/docs。
   - `External MCP companion`: 不需要填写 API key。按照 Settings 中的 MCP 指引，把外部 Claude/Codex client 连接到 Deburapy 的 MCP server。
8. 点击 `Test mediator` 和 `Test companion`。绿色点表示 endpoint 有响应。MCP companion 模式只验证 bridge 可达；浏览器无法证明外部 Claude/Codex client 已连接。
9. 关闭 settings，在左侧 session rail 点击 `Start`。倒计时应该开始，server 应保存 session 起止时间，Deburapy 应自动写第一条协调员消息。
10. Deburapy 会决定下一位发言者。默认把回合交给人类；也可以先把下一轮交给 AI 伴侣。
11. 当回合标记显示 `Next: Human` 时，在底部 composer 输入人类消息。composer 只用于人类。
12. 人类发送后，Deburapy 会把回合转给 AI 伴侣。BYOK API 模式会调用伴侣模型；MCP 模式会为外部 MCP client 排队一个 pending turn。
13. AI 伴侣回复后，回合回到 Deburapy。
14. 倒计时进入最后五分钟时，Deburapy 会标记收尾窗口，并在协调员、API 伴侣和 MCP 伴侣上下文中加入收尾提醒。
15. 点击 `End`，或让计时结束，以生成 session note。该 note 会自动保存进本地房间 store。transcript 或 note 的导出入口在 Settings > 本地存储，是可选项，主要用于备份或迁移；不建议把 note 当作日常阅读材料。
16. 当 key、model、quota 或连接失败时，使用左侧 footer 的 `Diagnostics` 或 `FAQ`。

## 视觉截图检查

先启动 `npm run dev`，然后运行：

```bash
npm run visual:check
```

该脚本会用 Playwright 打开本地 app，截取知情同意 gate、room UI、Settings > 本地存储和手机 session drawer，检查浏览器 console error，并验证 export 控件被收进 Settings，而不是放在主房间里。截图会写入 `.deburapy-artifacts/visual/`，该目录已被 git 忽略。

如果还没有安装 Playwright：

```bash
npm install
npx playwright install chromium
```

如果本机其他项目已经有兼容的 Playwright package，也可以临时指过去：

```bash
PLAYWRIGHT_PACKAGE_PATH=/absolute/path/to/node_modules/playwright npm run visual:check
```

## API 冒烟检查

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

## Channel Push 检查

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

## MCP 检查

对 Claude Code，先启动 web server，然后在 Deburapy repo root 执行：

```bash
claude mcp add --env DEBURAPY_URL=http://127.0.0.1:8787 \
  --transport stdio deburapy \
  -- node "$(pwd)/src/mcp-server.mjs"
```

如果你的 Claude Code build 需要项目配置，请参考
[../examples/claude-code.mcp.example.json](../examples/claude-code.mcp.example.json)，并替换绝对路径。

在 Claude Code 中用 `/mcp` 或以下命令验证：

```bash
claude mcp get deburapy
```

Claude Code 还可以通过实验性的 `notifications/claude/channel` 路径接收 channel wake-up：

```bash
claude mcp add --env DEBURAPY_URL=http://127.0.0.1:8787 \
  --env DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS=1 \
  --transport stdio deburapy \
  -- node "$(pwd)/src/mcp-server.mjs"
claude --dangerously-load-development-channels server:deburapy
```

Codex 支持优先通过 MCP tools 实现。Deburapy 不假设 Codex 具有与 Claude Code 相同的 host-specific channel notification extension。

如果 channel wake-up 不工作，请先验证标准 MCP tools：

```text
Call deburapy_get_pending_channel_pushes with claim=true, then reply with
deburapy_send_channel_reply.
```
