# Database

SQLite via `modernc.org/sqlite` (pure Go, FTS5 built in) and `sqlx`. DDL in `queries/schema.sql`
(embedded), applied idempotently at startup. WAL, foreign keys on, 5s busy timeout, write
transactions take the lock up front. SQL lives in `queries/*.sql` as named queries
(`-- name: get-task`) that goyesql prepares into `models.Queries`.
Default file: `./data/ezer.sqlite` (`DB_PATH`).

HTTP shapes: [api.md](api.md). Chat retrieval: [chat-pipeline.md](chat-pipeline.md).

## Model

1. **User** — `X-Ezer-User-Id` UUID  
2. **Origin** — one row per `(user_id, url origin)` from `tabUrl`  
3. **Chat** and **task** — scoped to an origin (all paths on a site share one thread and note list)

```
user → origin → chat
              → task → task_fts (FTS5 external content)
```

Soft delete: API `DELETE` sets `deleted_at`; reads use `deleted_at IS NULL`. No migration history
yet — after schema changes, delete the DB file and restart.

## Application flows

**`POST /captures`:** `upsert-origin` → user `CAPTURE` chat → LLM extract → `task` (+ `body` =
full selection) → assistant `TEXT` reply.

**Typed `POST /chat`:** FTS or list tasks by `origin_id` + `user_id`; recent `TEXT` chats for
follow-ups (`query-recent-text-chats`).

## Modules

| File | Responsibility |
| ---- | -------------- |
| `queries/schema.sql` | Tables, indexes, FTS5 + triggers |
| `queries/users.sql` / `origins.sql` | Identity and origin resolution (`upsert-origin` is one atomic upsert) |
| `queries/chats.sql` | Messages |
| `queries/tasks.sql` | CRUD, patch, `search-tasks` (FTS) |
| `models/queries.go` | The `Queries` struct the names are bound to |
| `internal/core/*.go` | Calls the queries and maps failures to HTTP errors |

## Enums

**`chat.message_type`:** `CAPTURE` (user JSON selection), `TEXT`, `QUICK_ACTION` (slash menu).

**`task.kind`:** `note` (default) \| `reminder`. **`task.status`:** `active` \| `done` \| `dismissed`.

## `task_fts`

External-content FTS5 over `task` (`title`, `summary`, `body`, `source_title`), porter tokenizer,
`bm25` ranking. Triggers `task_fts_ai` / `_ad` / `_au` sync on row changes. Assistant search:
[../services/README.md](../services/README.md#2-retrieve).

To rebuild after index definition changes:

```sql
INSERT INTO task_fts(rowid, title, summary, body, source_title)
SELECT rowid, title, summary, body, source_title FROM task WHERE deleted_at IS NULL;
```
