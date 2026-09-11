# Ezer

Ezer is a Chrome side-panel companion with two features:

1. **Workflow automation** — record real interactions on a page, save them as a reusable workflow, and replay them with synthetic DOM events.
2. **Personal assistant** — capture text from any page and Ezer turns it into tasks, reminders, and notes that stick around (per-tab, persisted in a local server).

## Features

### 1. Workflow automation

Record a task once, replay it whenever you need it.

1. Click **Record** in the side panel.
2. Do what you'd normally do — Ezer captures clicks, inputs, and form submissions on the capture phase.
3. Stop recording, name the workflow, and Ezer saves it locally (IndexedDB, per tab).
4. Replay any saved workflow — Ezer locates each element by its recorded selectors and drives it with synthetic DOM events.

### 2. Personal assistant

Keep track of things you come across while browsing.

1. Highlight text on any page while the panel is open — e.g. `Submit expense report by Friday 5pm`.
2. Ezer sends the selection to the server, where an LLM classifies it as a **task**, **reminder**, or **note** and extracts a title, due date, and summary.
3. The capture and the per-tab conversation are persisted in SQLite and reload when you return to that tab.

> **Roadmap:** due reminders and tasks will be pushed back to the user as notifications, turning captured items into an active to-do flow.

## Demo (30 seconds)

1. Start the server (see below) with `LLM_API_KEY` set.
2. Load the extension and open the side panel on any page.
3. **Assistant:** highlight text — e.g. `Submit expense report by Friday 5pm`. Ezer shows the capture in chat and replies with what it understood (task, reminder, or note).
4. **Workflow:** click Record, do a few actions on the page, stop, name it, then replay it from the saved-workflows list.
5. Switch tabs and come back — the conversation for that page reloads from the server, and saved workflows stay with their tab.

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
3. Record a workflow, or highlight text while the panel is open

### Build

```bash
npm run build
```

## Architecture

```
Workflow automation (all client-side)
  capture-phase listeners (content script)
    → recorded actions with priority-ordered selectors
    → IndexedDB (per tab)
    → replay via synthetic DOM events

Personal assistant (client → server)
  page selection (content script)
    → side panel chat UI (Lit)
    → Express API (POST /captures, POST /chat)
    → LLM structured extraction
    → SQLite (users, conversations, messages, captures, items)
```

| Layer            | Tech                                    |
| ---------------- | --------------------------------------- |
| Extension        | Manifest V3, Lit 3, TypeScript, esbuild |
| Workflow storage | IndexedDB (client-side, per tab)        |
| Server           | Express 4, better-sqlite3, TypeScript   |
| LLM              | DeepSeek (`deepseek-chat`), JSON mode   |
| Tooling          | Biome, Husky, strict TypeScript         |

## API

The server powers the personal-assistant feature. Workflow automation is entirely client-side (IndexedDB) and needs no server.

| Method | Path                              | Description                        |
| ------ | --------------------------------- | ---------------------------------- |
| `GET`  | `/health`                         | Liveness                           |
| `POST` | `/captures`                       | Extract and store a text selection |
| `GET`  | `/conversations/messages?tabUrl=` | Load chat for a tab                |
| `POST` | `/chat`                           | General Ezer assistant chat        |

See [server/README.md](server/README.md) for request/response shapes.

## Status

**Shipped:** workflow recording + replay (client-side), text selection capture, LLM task/reminder extraction, SQLite persistence, per-tab chat history.

**Roadmap:** notifications for due tasks and reminders.
