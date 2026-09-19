# Ezer

Ezer is a Chrome side-panel **personal and professional assistant**. Capture what you find while
browsing and Ezer turns it into reminders and notes. New ways to help are on the way.

## Features

### Personal assistant

Keep track of things you come across while browsing.

1. Highlight text on any page while the panel is open — e.g. `Submit expense report by Friday 5pm`.
2. Ezer turns the selection into a **reminder** or **note**, with a title, due date when relevant, and summary.
3. Your captures and Ezer's replies are saved and come back when you return to that tab.

> **Roadmap:** due reminders will be pushed back to you as notifications, turning captured items into an active to-do flow.

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
Personal assistant (client → server)
  page selection (content script)
    → side panel chat UI (Lit)
    → Express API (POST /captures, GET/POST /chat, GET/PATCH /task)
    → LLM structured extraction
    → SQLite (user, origin, chat, task)
```

| Layer    | Tech                                    |
| -------- | --------------------------------------- |
| Extension | Manifest V3, Lit 3, TypeScript, esbuild |
| Server   | Express 4, better-sqlite3, TypeScript   |
| LLM      | DeepSeek (`deepseek-chat`), JSON mode   |
| Tooling  | Biome, Husky, strict TypeScript         |

## API

The server powers the personal-assistant feature.

| Method   | Path                | Description                        |
| -------- | ------------------- | ---------------------------------- |
| `GET`    | `/health`           | Liveness                           |
| `GET`    | `/user`             | Get current user                   |
| `PUT`    | `/user`             | Register or sync user              |
| `DELETE` | `/user`             | Soft-delete user and owned data    |
| `POST`   | `/captures`         | Extract and store a text selection |
| `GET`    | `/chat?tabUrl=`     | List chat messages for an origin   |
| `POST`   | `/chat`             | Send a message and persist reply   |
| `DELETE` | `/chat/:id`         | Soft-delete a chat message         |
| `GET`    | `/task?tabUrl=`     | List tasks for an origin           |
| `GET`    | `/task/:id`         | Get one task                       |
| `POST`   | `/task`             | Create a task                      |
| `PATCH`  | `/task/:id`         | Update a task                      |

See [server/README.md](server/README.md) for full request/response shapes and error codes.

## Status

**Shipped:** text selection capture, LLM reminder/note extraction, SQLite persistence, per-tab capture history.

**Roadmap:** notifications for due reminders.

**Archived:** workflow recording and replay live on the `archive/workflow-recorder` branch.
