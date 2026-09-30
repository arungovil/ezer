# Ezer Server

Express API for notes, reminders, and the notes-grounded chat assistant. LLM-backed capture
extraction (`note` by default, `reminder` when the selection is actionable), per-origin persistence,
and user identity.

Default base URL: `http://localhost:3000`

## Setup

```bash
npm install
cp .env.example .env   # add LLM_API_KEY
npm run dev            # watch mode
```

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `LLM_API_KEY` | Yes (for `/chat`, `/captures`) | — | DeepSeek (or other OpenAI-compatible) API key |
| `LLM_BASE_URL` | No | `https://api.deepseek.com` | LLM API base URL |
| `LLM_MODEL` | No | `deepseek-chat` | Model name |
| `PORT` | No | `3000` | HTTP port |
| `DB_PATH` | No | `./data/ezer.sqlite` | SQLite database file |

## Authentication

User-scoped routes require a client-generated UUID in the request header:

```
X-Ezer-User-Id: <uuid-v4>
```

`/user` validates the header only; `/chat`, `/captures`, and `/task` also auto-register the user on
first use. `/health` needs no auth.

## Docs

| Doc | Contents |
| --- | -------- |
| [src/routes/README.md](src/routes/README.md) | HTTP API — conventions, errors, every endpoint |
| [src/services/README.md](src/services/README.md) | Chat assistant — classify → retrieve → answer pipeline |
| [src/db/README.md](src/db/README.md) | SQLite schema, entities, full-text search |

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled output |
| `npm run typecheck` | TypeScript check |
