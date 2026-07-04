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
| `DEBURAPY_URL` | `http://127.0.0.1:8787` | Base URL used by the stdio MCP server when it calls the local Deburapy API. |
| `DEBURAPY_ROOM_ID` | `default` | Default room ID used by MCP tools when the caller does not pass a room ID. |
| `DEBURAPY_PARTICIPANT_ID` | `companion` | Default participant ID used by MCP pending-push polling. |
| `DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS` | `0` | Set to `1` to enable the optional Claude Code channel-notification bridge in the MCP server. |
| `DEBURAPY_POLL_MS` | `3000` | Poll interval, in milliseconds, for optional Claude Code channel notifications. |
