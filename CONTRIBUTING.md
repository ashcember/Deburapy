# Contributing to Deburapy

Deburapy is an alpha, local-first project for AI-human relationship mediation
and repair debugging. Contributions are welcome, especially frontend polish,
JSON plugin design, reusable skills, docs, tests, and MCP/channel integration
work.

## Good First Contribution Areas

- Frontend: improve the local room UI, mobile state, accessibility, theme
  polish, and local-first storage surfaces.
- JSON plugins: help define manifest formats for mediator personas, scenario
  modules, check-in scales, repair artifacts, provider presets, and companion
  adapters.
- Skills: write practical Deburapy skills for common AI-human rupture patterns,
  account loss, memory discontinuity, prompt repair, continuity rituals, and
  artifact writing.
- Integrations: improve the MCP client path and platform-neutral channel API.

## Privacy Rules

Do not include private relationship data in code, prompts, docs, examples,
fixtures, screenshots, tests, issues, or pull requests.

Never commit:

- API keys, tokens, cookies, passwords, or credentials
- `.env` files other than `.env.example`
- `.deburapy-data/` or room transcripts
- unredacted session notes, provider logs, request bodies, or headers
- hidden chain-of-thought or private model traces

When a realistic example is needed, use fictional, generic, redacted content.

## Development Setup

Requirements:

- Node.js 20 or newer
- npm

```bash
npm install
npm test
```

Run the local app:

```bash
npm run dev
```

Then open `http://127.0.0.1:8787`.

For visual checks:

```bash
npm run visual:check
```

If Playwright browsers are missing, run:

```bash
npx playwright install chromium
```

## Pull Request Checklist

- Keep Deburapy non-clinical: it is not licensed therapy, medical care, legal
  advice, or crisis support.
- Keep prompts and skills generic.
- Keep local data and keys out of the repository.
- Run `npm test`.
- Run `npm run visual:check` when changing UI, layout, theme, or interaction
  flow.
- Update English and Simplified Chinese docs together when the change affects
  user-facing behavior.

