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
- DeepSeek or other OpenAI-compatible API key (for the assistant feature)

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
```

## Architecture

```
Notes and reminders (client → server)
  page selection (content script)
    → side panel chat UI (Lit)
    → Express API (POST /captures, GET/POST /chat, GET/PATCH /task)
    → LLM structured extraction
    → SQLite (user, origin, chat, task)

Chat (per site, answers only from saved notes)
  typed message
    → classify (LLM: specific | summary | out_of_scope)
    → retrieve notes (SQLite FTS5, scoped to the site)
    → answer (LLM, grounded in the retrieved notes)
```

| Layer    | Tech                                    |
| -------- | --------------------------------------- |
| Extension | Manifest V3, Lit 3, TypeScript, esbuild |
| Server   | Express 4, better-sqlite3, TypeScript   |
| LLM      | DeepSeek (`deepseek-chat`), JSON mode   |
| Tooling  | Biome, Husky, strict TypeScript         |

## API

The server powers notes, reminders, and the notes-grounded chat assistant.

| Method   | Path                | Description                        |
| -------- | ------------------- | ---------------------------------- |
| `GET`    | `/health`           | Liveness                           |
| `GET`    | `/user`             | Get current user                   |
| `PUT`    | `/user`             | Register or sync user              |
| `DELETE` | `/user`             | Soft-delete user and owned data    |
| `POST`   | `/captures`         | Extract and store a text selection |
| `GET`    | `/chat?tabUrl=`     | List chat messages for an origin   |
| `POST`   | `/chat`             | Ask about saved notes (classify → FTS retrieval → grounded reply) |
| `DELETE` | `/chat/:id`         | Soft-delete a chat message         |
| `GET`    | `/task?tabUrl=`     | List tasks for an origin           |
| `GET`    | `/task/:id`         | Get one task                       |
| `POST`   | `/task`             | Create a task                      |
| `PATCH`  | `/task/:id`         | Update a task                      |

See [server/README.md](server/README.md) for full request/response shapes and error codes.

## Status

**Shipped:** text selection capture, notes by default, reminders when the selection is actionable, grounded chat over saved notes, SQLite persistence, per-site history.

**Roadmap:** notifications for due reminders.
