# Contributing to Deburapy

Thanks for your interest in Deburapy. This project is a local-first room for a
human, an AI companion, and a relationship mediator. Contributions of all kinds
are welcome: bug reports, docs, tests, provider adapters, MCP client notes, and
features that fit the project's scope.

## Project scope and non-goals

Please read this before proposing a large change. PRs that push Deburapy in
these directions are out of scope and will be declined:

- Making it a licensed therapy or mental-health diagnosis tool.
- Turning it into a general-purpose debugger.
- Biasing it toward replacing an AI-human relationship with a human-human one.
- Adding built-in cloud accounts, telemetry, or anything that ships user data
  or API keys off the local machine by default.

Deburapy is BYOK (bring your own key) and local-first. Keep API keys out of the
repository, out of server-side storage, and out of logs.

## Development setup

Requirements:

- Node.js 20 or newer
- npm

```bash
git clone https://github.com/ashcember/Deburapy.git
cd Deburapy
node --version   # expect v20+
npm run dev      # starts the web server at http://127.0.0.1:8787
```

Deburapy has no runtime dependencies — it runs on the Node standard library, so
there is nothing to install for the app itself.

Copy `.env.example` to `.env` if you want to change the port or data dir. Keep
`DEBURAPY_HOST=127.0.0.1` for local work; the server refuses non-loopback binds
unless you explicitly opt in.

## Running the tests

```bash
npm test
```

The suite checks:

- The public mediator prompt stays generic (not tied to one deployment).
- The provider request builder keeps API keys out of request bodies.
- The frontend (`public/app.js` / `public/index.html`) stays wired: every
  `querySelector` id and every `els.*` reference has a matching element.
- The MCP stdio server handshakes, lists tools, and handles errors correctly.

Please run `npm test` before opening a PR. CI runs the same suite on Node 20 and
22, and PRs need a green check to merge.

## Making a change

1. Fork the repo and create a topic branch off `main`
   (e.g. `fix/mcp-timeout`, `feat/anthropic-provider`).
2. Keep the change focused. One logical change per PR is easier to review.
3. Match the existing style (see below) and add or update tests when you change
   behavior.
4. Run `npm test` locally.
5. Open a PR against `main` and fill in the PR template.

### Commit messages

Use short, imperative subject lines that describe the change, e.g.
`Add Anthropic provider adapter` or `Fix MCP pending-push claim race`. Explain
the "why" in the body when it is not obvious.

## Code style

- ES modules (`.mjs`), Node 20+ syntax, no build step.
- 2-space indentation, double quotes, semicolons — match the surrounding code.
- No new runtime dependencies without discussion first (open an issue). Part of
  Deburapy's value is that it runs on the Node standard library alone.
- Keep secrets out of logs. When you log request metadata, log the provider,
  model, and a sanitized base URL — never the API key.

## Reporting bugs and requesting features

Open an issue using the templates. For security-sensitive reports (for example,
a way that an API key could leak), please report privately via the repository's
**Security** tab ("Report a vulnerability") instead of filing a public issue.

## License

By contributing, you agree that your contributions are licensed under the
project's [AGPL-3.0-only](./LICENSE) license.
