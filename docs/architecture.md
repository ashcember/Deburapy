# Deburapy Architecture

Deburapy has four small pieces in the MVP.

## 1. Local Web App

`src/server.mjs` serves the static UI from `public/` and exposes JSON APIs for
rooms, messages, mediator generation, and generic channel pushes.

## 2. Local Store

`src/core/store.mjs` writes room state to `.deburapy-data/store.json` by default.
This is intentionally ignored by git so prototype transcripts and API keys do
not enter the repository.

## 3. Mediator Engine

`src/core/openai-compatible.mjs` builds OpenAI-compatible chat completion
requests. API keys are sent as headers only and are not stored by the server.

## 4. Companion MCP Server

`src/mcp-server.mjs` exposes a minimal stdio MCP server. It supports MCP clients
that can call tools, including Codex. It also has an opt-in Claude Code bridge:
when `DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS=1`, it polls pending channel pushes
and emits `notifications/claude/channel` messages for hosts that support that
Claude-specific extension.

## Public API Shape

The room model is intentionally platform-neutral:

- `room`
- `participant`
- `message`
- `channel_push`
- `participant_state`

Adapters for chat platforms should translate external messages into this shape
instead of writing platform-specific logic into the mediator.
