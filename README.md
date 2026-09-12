# Ezer

Ezer is a Chrome side-panel **personal and professional assistant**. Capture what you find while
browsing and Ezer turns it into tasks, reminders, and notes; it can also learn workflows and replay
them for you. New ways to help are on the way.

## Features

### Personal assistant

Keep track of things you come across while browsing.

1. Highlight text on any page while the panel is open — e.g. `Submit expense report by Friday 5pm`.
2. Ezer turns the selection into a **task**, **reminder**, or **note**, with a title, due date, and summary.
3. Your captures and Ezer's replies are saved and come back when you return to that tab.

> **Roadmap:** due reminders and tasks will be pushed back to you as notifications, turning captured items into an active to-do flow.

### Workflows

Record a repetitive on-page task once, replay it when you need it.

1. Click **Record** in the side panel.
2. Do what you'd normally do — Ezer captures your clicks, inputs, and form submissions.
3. Stop recording, name the workflow, and Ezer saves it for that tab.
4. Replay any saved workflow — Ezer finds each element and runs the steps for you.

## Demo (30 seconds)

1. Start the server (see below) with `LLM_API_KEY` set.
2. Load the extension and open the side panel on any page.
3. **Assistant:** highlight text — e.g. `Submit expense report by Friday 5pm`. Ezer shows the capture in chat and replies with what it understood (task, reminder, or note).
4. **Workflow:** click Record, do a few actions on the page, stop, name it, then replay it from the saved-workflows list.
5. Switch tabs and come back — your captures for that page reload from the server, and saved workflows stay with their tab.

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
3. Highlight text while the panel is open, or record a workflow

### Build

```bash
npm run build
```

## Architecture

```
Personal assistant (client → server)
  page selection (content script)
    → side panel chat UI (Lit)
    → Express API (POST /captures, POST /chat)
    → LLM structured extraction
    → SQLite (users, conversations, messages, captures, items)

Workflows (all client-side, optional)
  capture-phase listeners (content script)
    → recorded actions with priority-ordered selectors
    → IndexedDB (per tab)
    → replay via synthetic DOM events
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
| `GET`  | `/user`                           | Get current user                   |
| `PUT`  | `/user`                           | Register or sync user              |
| `DELETE` | `/user`                         | Delete user and owned data         |
| `POST` | `/captures`                       | Extract and store a text selection |
| `GET`  | `/chat?tabUrl=`                   | List chat messages for an origin   |
| `POST` | `/chat`                           | Send a message and persist reply   |
| `DELETE` | `/chat/:id`                     | Delete a chat message              |

See [server/README.md](server/README.md) for full request/response shapes and error codes.

## Status

**Shipped:** text selection capture, LLM task/reminder/note extraction, SQLite persistence, per-tab capture history; workflow recording + replay.

**Roadmap:** notifications for due tasks and reminders.
