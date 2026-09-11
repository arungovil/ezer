# Ezer

Chrome side-panel assistant that captures text you highlight on any page, uses an LLM to extract tasks and reminders, and persists them in a local SQLite-backed API.

## Demo (30 seconds)

1. Start the server (see below) with `LLM_API_KEY` set.
2. Load the extension and open the side panel on any page.
3. Highlight text — e.g. `Submit expense report by Friday 5pm` or `Call dentist tomorrow at 10`.
4. Ezer shows the capture in chat and replies with what it understood (task, reminder, or note).
5. Switch tabs and come back — the conversation for that page reloads from the server.

## Getting started

### Prerequisites

- Node.js ≥ 20
- Chrome (Manifest V3 side panel)
- DeepSeek or other OpenAI-compatible API key

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
Page selection (content script)
  → side panel chat UI (Lit)
  → Express API (POST /captures)
  → LLM structured extraction
  → SQLite (users, conversations, messages, captures, items)
```

| Layer | Tech |
| ----- | ---- |
| Extension | Manifest V3, Lit 3, TypeScript, esbuild |
| Server | Express 4, better-sqlite3, TypeScript |
| LLM | DeepSeek (`deepseek-chat`), JSON mode |
| Tooling | Biome, Husky, strict TypeScript |

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | Liveness |
| `POST` | `/captures` | Extract and store a text selection |
| `GET` | `/conversations/messages?tabUrl=` | Load chat for a tab |
| `POST` | `/chat` | General Ezer assistant chat |

See [server/README.md](server/README.md) for request/response shapes.

## Status

**Shipped:** text selection capture, LLM task/reminder extraction, SQLite persistence, per-tab chat history.
