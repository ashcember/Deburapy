# Security Policy

Deburapy is local-first alpha software for AI-human relationship mediation and
repair workflows. Treat room transcripts, session notes, API keys, companion
documents, and provider traces as sensitive data.

## Supported Versions

Security fixes target the `main` branch until release channels exist.

## Reporting a Vulnerability

Please do not open a public issue that contains secrets, private transcripts,
API keys, unredacted provider logs, or personal relationship data.

Use GitHub private vulnerability reporting if it is enabled for this repository.
If it is not enabled, open a minimal public issue that says a private security
report is needed, without including sensitive details.

Include only the minimum safe information needed to reproduce the issue:

- Deburapy version or commit SHA
- operating system and Node.js version
- affected surface, such as web UI, local API, MCP server, storage, or docs
- redacted reproduction steps
- whether local files under `.deburapy-data/` may be affected

## Sensitive Data Rules

Do not paste or upload:

- API keys, tokens, cookies, passwords, or credentials
- private room transcripts or session notes
- companion system prompts that contain private relationship details
- unredacted provider logs, request bodies, or headers
- hidden chain-of-thought or private model traces

If examples are needed, provide summaries or redacted excerpts.

## Local-Only Boundary

By default, Deburapy binds to `127.0.0.1` and stores room data in
`.deburapy-data/store.json`. The server has no built-in authentication.

Do not bind Deburapy outside loopback unless you put it behind your own
authentication and network boundary. `DEBURAPY_ALLOW_UNSAFE_BIND=1` is an
explicit opt-in for advanced local deployments, not a public hosting mode.

