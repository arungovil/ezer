# Ezer Server

Go (chi) API for capture extraction, per-origin notes/reminders, and notes-grounded chat.

Default base URL: `http://localhost:3000`. From the monorepo root: `npm run dev:server` (see
[../README.md](../README.md) for extension setup).

## Setup

Go 1.26+ (set by the SQLite driver).

```bash
cp .env.example .env   # add LLM_API_KEY
make run
```

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `LLM_API_KEY` | Yes for `/captures` and typed `/chat` | — | OpenAI-compatible API key. `POST /chat` with `action` works without it |
| `LLM_BASE_URL` | No | `https://api.deepseek.com` | LLM API base URL |
| `LLM_MODEL` | No | `deepseek-chat` | Model name |
| `PORT` | No | `3000` | HTTP port |
| `DB_PATH` | No | `./data/ezer.sqlite` | SQLite file |

A `.env` in the working directory is loaded if present; real environment variables win.

## Authentication

```
X-Ezer-User-Id: <uuid-v4>
```

`/user` validates the header only. `/chat`, `/captures`, and `/task` also upsert the user on first
use. `/health` is unauthenticated.

## Layout

Handlers in `cmd/`, DB access and logic in `internal/core`, shared types in `models/`, SQL in
`queries/`.

| Path | Role |
| ---- | ---- |
| `cmd/` | `main`, config/init, chi routes, thin handlers (methods on `App`) |
| `internal/core/` | DB + business logic; returns `*HTTPError` ready to send |
| `internal/llm/` | OpenAI-compatible chat-completions client |
| `models/` | Row/request/response types (`db` + `json` tags) and `Queries` |
| `queries/` | `schema.sql` and named queries (`*.sql`), embedded in the binary |
| `docs/` | API, chat pipeline, database |

## Further reading

| Doc | Contents |
| --- | -------- |
| [docs/api.md](docs/api.md) | HTTP API — every endpoint, errors |
| [docs/chat-pipeline.md](docs/chat-pipeline.md) | Typed chat pipeline |
| [docs/database.md](docs/database.md) | SQLite model and queries |

## Commands

| Command | Description |
| ------- | ----------- |
| `make run` | Run the server |
| `make build` | Build `./ezer-server` (`CGO_ENABLED=0`) |
| `make test` | Tests with the race detector |
| `make vet` / `make fmt` | Static checks / gofmt |
