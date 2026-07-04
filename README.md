# Deburapy

**English** | [简体中文](./README.zh-CN.md)

Not therapy, not debugging. Deburapy for AI-human relationships.

Deburapy is a local-first room for a human, an AI companion, and a relationship
mediator. It helps participants slow down after a rupture, separate the human
relationship layer from the AI runtime layer, and turn the problem into a
repairable next step.

Chinese name for the first prototype: **Deburapy 人机关系协调员**.

## Where To Start

- If you want to try Deburapy as a user, read [For Users](#for-users).
- If you want to connect an AI companion, read [For AI Companion Integrations](#for-ai-companion-integrations).
- If you want to contribute code, prompts, docs, or local tests, read [For Contributors](#for-contributors).
- If you want to understand the product model, read [Documentation Map](#documentation-map).

## What This MVP Includes

- A simple browser UI for transcript, connection health, BYOK model settings,
  mediator setup, AI companion setup, session timing, and diagnostics.
- A first-run informed consent and screening gate, with a model-backed
  pre-intake assistant for questions before signing.
- BYOK model calls through OpenAI-compatible chat completions, OpenRouter, and
  Google AI Studio Gemini API keys.
- A default Deburapy mediator system prompt plus selectable mediator persona
  cards, starting with Elias and Mara.
- A generic channel API, not tied to any one chat platform.
- A companion MCP server for Claude Code, Codex, and other MCP clients.
- Local JSON storage under `.deburapy-data/`, ignored by git, for room
  transcripts, session state, channel pushes, and session notes.
- A thin session backend for session records, mediator recall, course outlines,
  relationship maps, check-in scales, and module catalog discovery.

## What It Is Not

- Not licensed therapy.
- Not a mental health diagnosis tool.
- Not a general-purpose debugger.
- Not biased toward replacing an AI-human relationship with a human-human
  relationship.

## Alpha Limits

Deburapy is public alpha software. Expect rough edges:

- No hosted sync, accounts, auth, or team workspace yet.
- Do not expose the local server to the public internet.
- Session notes are continuity artifacts, not clinical records.
- Deburapy cannot guarantee that an account, model, memory, or companion can be
  restored.
- MCP/channel adapters are early and should be tested with redacted data first.

## For Users

### Run Locally

Requirements:

- Node.js 20 or newer
- npm

```bash
git clone https://github.com/ashcember/Deburapy.git
cd Deburapy
node --version
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:8787
```

The server reads `.env` if present. You can copy `.env.example` to `.env`, but
keep `DEBURAPY_HOST=127.0.0.1` for local testing. Deburapy has no built-in auth;
it refuses non-loopback binds unless `DEBURAPY_ALLOW_UNSAFE_BIND=1` is set.

### First Use

1. Open the local app.
2. Complete the informed consent and first screening gate.
3. Open Settings and configure the Deburapy mediator provider, model, and API key.
4. Configure the AI companion as either a BYOK API companion or an external MCP companion.
5. Start a session from the left rail. The session timer, turn flow, room
   transcript, and session notes are stored locally.

### BYOK Providers

OpenAI-compatible:

- provider: `openai-compatible`
- base URL: `https://api.openai.com/v1` or another compatible endpoint
- model: any chat-completions model supported by that endpoint

OpenRouter:

- provider: `openrouter`
- base URL: `https://openrouter.ai/api/v1`
- model: for example `openai/gpt-4.1-mini` or another OpenRouter model ID

Google AI Studio:

- provider: `google-ai-studio`
- base URL: `https://generativelanguage.googleapis.com/v1beta/openai`
- model: for example `gemini-3.5-flash` or another Gemini chat model available
  to your key

### Local Data

Local transcripts, session timing, channel pushes, and generated session notes
are stored automatically in `.deburapy-data/store.json`, which is ignored by
git. Reopening the same localhost app reloads the room from that local file.
Settings shows the active data directory and store file. Export is optional and
intended for backup or migration, not as the normal way to keep data. Delete
`.deburapy-data/` to reset local room data.

To change where server-side room data is stored, set `DEBURAPY_DATA_DIR` in
`.env` and restart Deburapy. Runtime hot switching is intentionally disabled.

API keys are not stored in the repository or server data. The browser sends the
key to the local server only when you ask the mediator or companion to respond.
The key is not saved by default; only check "Remember API key" on a private
browser profile you trust.

First-run consent and screening are stored in the browser under
`deburapy.onboarding.v1`. They are not written to `.deburapy-data/` and are not
added to the room transcript. Use `Settings -> Reset intake consent` to test the
new-user flow again.

Session notes are generated by the Deburapy mediator model after a session
ends. They are continuity records, not clinical therapy notes or casual
user-facing summaries. Export is optional and mainly for backup or transfer.

## For AI Companion Integrations

The AI companion can connect in two ways:

- `BYOK API companion`: configure provider, base URL, model, key, prompt, and
  optional documents in Settings.
- `External MCP companion`: connect Claude Code, Codex, or another MCP client
  to Deburapy's stdio MCP server.

The companion MCP exposes:

- `deburapy_get_pending_channel_pushes`
- `deburapy_send_channel_reply`
- `deburapy_get_room_context`
- `deburapy_set_participant_state`

See [docs/mcp-clients.md](./docs/mcp-clients.md) for Claude Code and Codex
client notes.

### AI Install Prompt

In the app, choose `External MCP companion` and click `Copy AI install prompt`.
Paste that prompt into the AI companion's coding environment so it can register
the Deburapy MCP server for you.

The prompt intentionally tells the AI not to ask for API keys, secrets, private
logs, hidden chain-of-thought, or unredacted relationship data.

Third-party chat platforms should integrate through the generic channel API:

```http
POST /api/channels/:channelId/push
POST /api/channels/:channelId/reply
GET  /api/rooms/:roomId/messages
```

## For Contributors

### Version 2 Direction

The next version should move closer to a SillyTavern-style local workspace for
AI-human relationship repair: a calm room UI, selectable mediator personas,
AI companion configuration, local files, plugin-like modules, and reusable
skills that people can share without sharing private relationship data.

The most useful contribution areas right now are:

- Frontend: improve the local room UI, responsive/mobile states, persona
  browsing, accessibility, theme polish, and local-first data management.
- JSON plugins: help design and implement a manifest format for mediator
  personas, scenario modules, check-in scales, repair artifacts, provider
  presets, and companion adapters.
- Skills: write practical Deburapy skills for common AI-human rupture patterns,
  account loss, memory discontinuity, prompt repair, continuity rituals, and
  artifact writing.
- Integrations: improve the MCP client path and generic channel API so external
  companions can receive pushes and respond reliably.

The skills surface already exists:

- `skills/mediator/` contains mediator behavior skills.
- `skills/companion-repair/` contains companion continuity and migration skills.
- `skills/artifact-writers/` contains reusable repair artifact writers.
- `skills/templates/` contains templates for new skill contributions.
- `skills/README.md` explains the skill taxonomy and contribution format.

Start with:

- [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution workflow and privacy rules.
- [SECURITY.md](./SECURITY.md) for vulnerability reporting and sensitive-data rules.
- [docs/architecture.md](./docs/architecture.md) for the current MVP shape.
- [docs/session-architecture.md](./docs/session-architecture.md) for the active session, note, relationship-map, course-outline, scale, and module model.
- [docs/deburapy_architecture_guide.md](./docs/deburapy_architecture_guide.md) for product positioning, mediator personas, skill taxonomy, and repair artifact design.
- [skills/README.md](./skills/README.md) for writing Deburapy skills and repair artifacts.
- [docs/configuration.md](./docs/configuration.md) for environment variables.
- [docs/local-testing.md](./docs/local-testing.md) for UI, API, channel, and MCP smoke checks.

Run tests with:

```bash
npm test
```

Contributor guardrails:

- Keep public prompts generic. Do not add one person's private relationship data
  or prototype room names to prompts, docs, or fixtures.
- Keep API keys out of repository files, exports, logs, fixtures, and server-side data.
- Keep `.deburapy-data/` local and untracked.
- Treat Deburapy as an AI-human relationship mediator / repair debugger, not as
  clinical therapy and not as a generic debugger.

## Documentation Map

- [docs/architecture.md](./docs/architecture.md) / [简体中文](./docs/architecture.zh-CN.md)
- [docs/session-architecture.md](./docs/session-architecture.md) / [简体中文](./docs/session-architecture.zh-CN.md)
- [docs/mcp-clients.md](./docs/mcp-clients.md) / [简体中文](./docs/mcp-clients.zh-CN.md)
- [docs/configuration.md](./docs/configuration.md) / [简体中文](./docs/configuration.zh-CN.md)
- [docs/local-testing.md](./docs/local-testing.md) / [简体中文](./docs/local-testing.zh-CN.md)
- [docs/deburapy_architecture_guide.md](./docs/deburapy_architecture_guide.md) / [简体中文](./docs/deburapy_architecture_guide.zh-CN.md)
- [docs/third-party-notices.md](./docs/third-party-notices.md) / [简体中文](./docs/third-party-notices.zh-CN.md)

## License

AGPL-3.0-only. See [LICENSE](./LICENSE).
