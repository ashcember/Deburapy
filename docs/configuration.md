# Configuration

[简体中文](./configuration.zh-CN.md)

Deburapy reads `.env` from the project root when present. Environment variables
set in the shell take precedence over `.env`.

Keep `DEBURAPY_HOST=127.0.0.1` unless you put Deburapy behind your own auth
boundary. The local server has no built-in authentication.

| Variable | Default | What it does |
| --- | --- | --- |
| `DEBURAPY_HOST` | `127.0.0.1` | Host for the local web server and JSON API. Non-loopback hosts are refused unless unsafe binding is explicitly enabled. |
| `DEBURAPY_PORT` | `8787` | Port for the local web server and JSON API. |
| `DEBURAPY_DATA_DIR` | `.deburapy-data` | Local data directory for `store.json`, including room transcripts, session records, channel pushes, and session notes. |
| `DEBURAPY_ALLOW_UNSAFE_BIND` | `0` | Set to `1` only when binding outside loopback behind your own authentication and network boundary. |
| `DEBURAPY_ENABLE_HOSTED_DEMO` | `0` | Set to `1` to let the mediator and pre-intake assistant use a server-side hosted demo key. |
| `DEBURAPY_HOSTED_DEMO_GOOGLE_AI_STUDIO_API_KEY` | empty | Server-only Google AI Studio key for hosted demos. Never expose it to frontend code or commit it. |
| `DEBURAPY_HOSTED_DEMO_MODEL` | `gemini-3.5-flash` | Model used by the hosted demo mediator. |
| `DEBURAPY_HOSTED_DEMO_BASE_URL` | Google AI Studio OpenAI-compatible URL | Base URL used by the hosted demo mediator. |
| `DEBURAPY_HOSTED_DEMO_RATE_LIMIT_PER_MINUTE` | `12` | Best-effort per-IP in-memory limit for hosted demo calls. This is not a full abuse-prevention system. |
| `DEBURAPY_URL` | `http://127.0.0.1:8787` | Base URL used by the stdio MCP server when it calls the local Deburapy API. |
| `DEBURAPY_ROOM_ID` | `default` | Default room ID used by MCP tools when the caller does not pass a room ID. |
| `DEBURAPY_PARTICIPANT_ID` | `companion` | Default participant ID used by MCP pending-push polling. |
| `DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS` | `0` | Set to `1` to enable the optional Claude Code channel-notification bridge in the MCP server. |
| `DEBURAPY_POLL_MS` | `3000` | Poll interval, in milliseconds, for optional Claude Code channel notifications. |

`DEBURAPY_DATA_DIR` is read when the server starts. To move local room storage,
set it in `.env` and restart Deburapy; Settings shows the active resolved
directory and `store.json` path.

## Hosted Demo Key

For a public Vercel demo, set `DEBURAPY_ENABLE_HOSTED_DEMO=1` and store
`DEBURAPY_HOSTED_DEMO_GOOGLE_AI_STUDIO_API_KEY` as a Vercel environment
variable. The browser only receives provider, base URL, model, and a "hosted
demo key" label; it never receives the key value.

Hosted demo mode is intentionally limited to Deburapy's mediator, pre-intake
assistant, mediator connection test, and session note generation. It is not
available for BYOK AI companion calls, so the deployment does not become a
general-purpose model proxy. Use a restricted, low-quota Google AI Studio key
and add stronger auth / quota controls before treating it as a production
public service.

On Vercel, if `DEBURAPY_DATA_DIR` is not set, server-side room storage defaults
to `/tmp/deburapy-data`. That filesystem is suitable for demos only; it is not
durable product storage.
