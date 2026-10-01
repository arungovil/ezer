# Database

SQLite via better-sqlite3. DDL in `schema.ts`, applied on every `getDb()`. WAL, foreign keys on.
Default file: `./data/ezer.sqlite` (`DB_PATH`).

HTTP shapes: [../routes/README.md](../routes/README.md). Chat retrieval: [../services/README.md](../services/README.md).

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

**`POST /captures`:** `getOrCreateOrigin` → user `CAPTURE` chat → LLM extract → `task` (+ `body` =
full selection) → assistant `TEXT` reply.

**Typed `POST /chat`:** FTS or list tasks by `origin_id` + `user_id`; recent `TEXT` chats for
follow-ups (`listRecentChatsByOriginId`).

## Modules

| File | Responsibility |
| ---- | -------------- |
| `schema.ts` | Tables, indexes, FTS5 + triggers |
| `index.ts` | Connection and schema apply |
| `soft-delete.ts` | `deleted_at` query helpers |
| `user.ts` / `origin.ts` | Identity and origin resolution |
| `chat.ts` | Messages |
| `task.ts` | CRUD + `searchTasksByOrigin` (FTS) |

## Enums (also in `types.ts`)

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
