# Ezer Server

Express API for capture extraction, per-origin notes/reminders, and notes-grounded chat.

Default base URL: `http://localhost:3000`. From the monorepo root: `npm run dev:server` (see
[../README.md](../README.md) for extension setup).

## Setup

```bash
npm install
cp .env.example .env   # add LLM_API_KEY
npm run dev
```

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `LLM_API_KEY` | Yes for `/captures` and typed `/chat` | — | OpenAI-compatible API key. `POST /chat` with `action` works without it |
| `LLM_BASE_URL` | No | `https://api.deepseek.com` | LLM API base URL |
| `LLM_MODEL` | No | `deepseek-chat` | Model name |
| `PORT` | No | `3000` | HTTP port |
| `DB_PATH` | No | `./data/ezer.sqlite` | SQLite file |

## Authentication

```
X-Ezer-User-Id: <uuid-v4>
```

`/user` validates the header only. `/chat`, `/captures`, and `/task` also upsert the user on first
use. `/health` is unauthenticated.

## Further reading

| Doc | Contents |
| --- | -------- |
| [src/routes/README.md](src/routes/README.md) | HTTP API — every endpoint, errors |
| [src/services/README.md](src/services/README.md) | Typed chat pipeline |
| [src/db/README.md](src/db/README.md) | SQLite model and modules |

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Hot reload (`tsx watch`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run `dist/` |
| `npm run typecheck` | TypeScript check |
