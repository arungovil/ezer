# Ezer

Ezer is a Chrome side-panel **personal assistant** for taking notes, and for reminders when
something you find is worth acting on.

## Features

### Notes

Highlight text on any page while the panel is open — a quote, a link, a fact, a paragraph you want
to keep. Ezer saves it as a **note** with a title and a short summary. Captures and Ezer's replies
come back when you return to that site.

### Reminders

When the selection is something to do, Ezer saves a **reminder** instead. A date or time in the text
(for example, `Submit expense report by Friday 5pm`) becomes a due date in your timezone. If it is
actionable but has no time, the reminder is saved without one.

### Chat about your notes

Ask Ezer about what you've saved on the current site. It answers **only** from those notes — ask a
factual question (`what is a dam?`), whether you saved something (`do I have a note about X?`), or
for a summary (`summarise my notes`). If the notes don't cover it, Ezer says so; it won't fall back
to general knowledge. Follow-up questions keep the topic from the previous turn.

> **Roadmap:** notify you when a reminder is due.

## Getting started

### Prerequisites

- Node.js ≥ 20
- Chrome (Manifest V3 side panel)
- DeepSeek or other OpenAI-compatible API key (for capture extraction and typed chat)

### Setup

```bash
npm run setup

cp server/.env.example server/.env   # add LLM_API_KEY
cp client/.env.example client/.env   # server URL, default http://localhost:3000
```

### Development

Terminal 1 — API + SQLite:

```bash
npm run dev:server
```

Terminal 2 — extension watch build:

```bash
npm run dev:client
```

Load the extension:

1. `chrome://extensions` → Developer mode → Load unpacked → `client/`
2. Pin Ezer, open the side panel on a tab
3. Highlight text while the panel is open

### Build

```bash
npm run build
npm run typecheck   # optional
```

## Architecture

```
page selection (content script)
  → background worker (routing, panel-open gate)
  → side panel (Lit UI, API client)
  → Express (captures, chat, task, user)
  → SQLite (per-user, per-origin notes + chat)
```

| Layer     | Tech                                    |
| --------- | --------------------------------------- |
| Extension | Manifest V3, Lit 3, TypeScript, esbuild |
| Server    | Express 4, better-sqlite3, TypeScript   |
| LLM       | DeepSeek (`deepseek-chat`), JSON mode   |
| Tooling   | Biome, Husky, strict TypeScript         |

Grounded chat on the server: classify → FTS5 retrieval → answer (see
[server/src/services/README.md](server/src/services/README.md)).

## Documentation

| Doc | Audience |
| --- | -------- |
| [AGENTS.md](AGENTS.md) | Repo layout, API contracts, coding conventions |
| [server/README.md](server/README.md) | Server setup, env, auth |
| [server/src/routes/README.md](server/src/routes/README.md) | HTTP API (request/response, errors) |
| [server/src/services/README.md](server/src/services/README.md) | Chat assistant pipeline |
| [server/src/db/README.md](server/src/db/README.md) | SQLite model, modules, FTS |

## Status

**Shipped:** text selection capture, notes by default, reminders when actionable, grounded chat over
saved notes, SQLite persistence, per-site history.

**Roadmap:** notifications for due reminders.
