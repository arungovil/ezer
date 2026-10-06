<p align="center">
<h2 align="center">Ezer</h2>
</p>
<p align="center">
Chrome side-panel assistant for notes and reminders. Chat is grounded in what you saved on the current site.
</p>

---

## What it does

- **Notes** — highlight text with the panel open; Ezer saves a title and short summary.
- **Reminders** — actionable highlights become reminders; dates/times in the text become due dates in your timezone.
- **Chat** — ask about notes on this site. If they don’t cover it, Ezer says so.

> Notifications when a reminder is due are on the roadmap.

## Setup

Node.js ≥ 20, Chrome (MV3 side panel), and an OpenAI-compatible API key (DeepSeek by default).

```sh
npm run setup

cp server/.env.example server/.env   # LLM_API_KEY
cp client/.env.example client/.env   # server URL, default http://localhost:3000
```

## Running locally

```sh
npm run dev:server
```

```sh
npm run dev:client
```

Then load the extension:

1. `chrome://extensions` → Developer mode → Load unpacked → `client/`
2. Pin Ezer and open the side panel
3. Highlight text on a page

```sh
npm run build
npm run typecheck
```

Type `/` in the panel for notes, reminders, and help.

## Docs

[AGENTS.md](AGENTS.md) · [server](server/README.md) · [API](server/src/routes/README.md) · [chat pipeline](server/src/services/README.md) · [database](server/src/db/README.md)
