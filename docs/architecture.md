# Deburapy Architecture

Deburapy has four small pieces in the MVP.

## 1. Local Web App

`src/server.mjs` serves the static UI from `public/` and exposes JSON APIs for
rooms, messages, mediator generation, and generic channel pushes.

## 2. Local Store

`src/core/store.mjs` writes room state to `.deburapy-data/store.json` by default.
This is intentionally ignored by git so local transcripts, session timing,
channel pushes, and generated session notes do not enter the repository.
Reopening the same localhost app reloads the room from that local file. API keys
are not stored server-side; the browser sends the key to the local server only
when a model call is requested.

## 3. Mediator Engine

`src/core/openai-compatible.mjs` builds OpenAI-compatible chat completion
requests for generic OpenAI-compatible providers, OpenRouter, and Google AI
Studio's Gemini OpenAI compatibility endpoint. API keys are sent as headers
only and are not stored by the server.

The mediator and AI companion are separate runtime roles:

- `/api/mediator/respond` uses the Deburapy mediator prompt and writes a
  mediator message.
- `/api/companion/respond` uses the configured AI companion prompt/documents
  and writes an AI companion message.
- `/api/companion/mcp-request` queues the current room context for an external
  MCP companion without requiring a BYOK API key.
- `/api/connections/test` is the browser-facing diagnostics path for model
  reachability checks.
- `/api/rooms/:roomId/session/start` stores server-side session start/end
  timing.
- `/api/rooms/:roomId/session/wrap-up` marks that the five-minute wrap-up cue
  was sent.
- `/api/rooms/:roomId/session/end` ends the session and asks the mediator model
  to write a continuity note.
- `/api/rooms/:roomId/session-notes/:noteId/download` downloads that note as
  markdown.

The browser composer is intentionally human-only. The other two roles speak
through their configured connections instead of through a role selector.
The guided turn flow is Deburapy -> Human -> AI Companion -> Deburapy. The
mediator can choose `Next speaker: companion` when it needs the AI companion's
runtime-side account before the human answers. In the browser UI, `Start`
begins the session countdown and triggers the first Deburapy mediator response.

Session timing is part of the prompt context for Deburapy, the API companion,
and the external MCP companion. When five minutes or less remain, the prompt
context includes a wrap-up reminder to close loops rather than open a large new
topic.

Prototype persistence lives in `.deburapy-data/store.json`. Each room owns
messages, pending channel pushes, one current `session` object, and a
`sessionNotes` array. Session notes are intended for local continuity first;
export is optional backup or transfer, and the UI does not frame downloading as
the save step.

The default web layout keeps the room uncluttered: session metadata and the
60/90 minute countdown live in the left rail, connection status lives in compact
top-right chips, and provider/prompt/document controls live in the Settings
drawer.

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

See [session-architecture.md](./session-architecture.md) for the planned
session, note, relationship-map, course-outline, scale, and module model.
See [deburapy_architecture_guide.md](./deburapy_architecture_guide.md) for the
broader product architecture, mediator personas, skill taxonomy, and repair
artifact model.
