# Ezer Server

Express API for the personal-assistant feature: LLM-backed capture extraction (`reminder` | `note`), per-origin chat and task persistence, workflow storage, and user identity. Workflow replay is client-side; the extension still uses IndexedDB until wired to `GET/POST /workflow`.

Default base URL: `http://localhost:3000`

> **API docs:** Document every new route in this file — overview table plus a dedicated section with headers, request/response shapes, and error codes.

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

Database schema: [src/db/README.md](src/db/README.md)

## Authentication

User-scoped routes require a client-generated UUID in the request header:

```
X-Ezer-User-Id: <uuid-v4>
```

| Route group | Middleware | Behavior |
| ----------- | ---------- | -------- |
| `/user` | `requireUserId` | Validates header only |
| `/chat`, `/captures`, `/workflow`, `/task` | `requireUser` | Validates header and auto-registers the user if missing |
| `/health` | — | No auth |

Register explicitly with `PUT /user` on first run. Other routes will create the user row on first use.

## API overview

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/health` | — | Liveness check |
| `GET` | `/user` | `X-Ezer-User-Id` | Get current user |
| `PUT` | `/user` | `X-Ezer-User-Id` | Register or sync current user |
| `DELETE` | `/user` | `X-Ezer-User-Id` | Soft-delete user and all owned data |
| `GET` | `/chat?tabUrl=` | `X-Ezer-User-Id` | List chat messages for an origin |
| `POST` | `/chat` | `X-Ezer-User-Id` | Send a message and persist the reply |
| `DELETE` | `/chat/:id` | `X-Ezer-User-Id` | Soft-delete a chat message |
| `POST` | `/captures` | `X-Ezer-User-Id` | Extract and store a text selection |
| `GET` | `/workflow?tabUrl=` | `X-Ezer-User-Id` | List workflows for an origin |
| `GET` | `/workflow/:id` | `X-Ezer-User-Id` | Get one workflow |
| `POST` | `/workflow` | `X-Ezer-User-Id` | Save a workflow |
| `GET` | `/task?tabUrl=` | `X-Ezer-User-Id` | List tasks for an origin |
| `GET` | `/task/:id` | `X-Ezer-User-Id` | Get one task |
| `POST` | `/task` | `X-Ezer-User-Id` | Create a task |
| `PATCH` | `/task/:id` | `X-Ezer-User-Id` | Update a task |

All JSON endpoints use `Content-Type: application/json`. CORS is enabled for local extension development.

### Soft delete

`DELETE` routes never remove rows from SQLite. They set `deleted_at` (ISO 8601) on the affected row(s). All reads filter `deleted_at IS NULL`. `DELETE /user` soft-deletes the user and cascades to owned origins, chats, tasks, and workflows. **Account deletion is irreversible from the product's perspective** — re-registering clears `deleted_at` on the user row and revisiting a site restores the origin shell, but cascaded chat/task/workflow rows stay hidden.

### Error responses

Failed requests return:

```json
{ "error": "human-readable message" }
```

| Status | When |
| ------ | ---- |
| `400` | Invalid or missing request body / query |
| `401` | Missing or invalid `X-Ezer-User-Id` |
| `404` | Resource not found |
| `409` | Conflict (e.g. deleting a capture linked to a task) |
| `500` | Persist or internal failure |
| `502` | LLM request failed (`POST /chat` only) |
| `503` | `LLM_API_KEY` not configured |

---

## `GET /health`

Liveness probe for hosting and local dev.

**Response `200`**

```json
{ "status": "ok" }
```

---

## `GET /user`

Return the authenticated user. Does **not** create a row — use `PUT /user` to register.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | User UUID |
| `createdAt` | `string` | ISO 8601 timestamp |

**Errors:** `401` invalid header · `404` user not registered

---

## `PUT /user`

Register the client identity on the server (idempotent).

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Response `200`**

Same shape as `GET /user`.

**Errors:** `401` invalid header · `500` persist failed

---

## `DELETE /user`

Soft-delete the user and all owned data (origins, chats, tasks, workflows). Rows remain in SQLite with `deleted_at` set.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Response `204`** — no body.

**Errors:** `401` invalid header · `404` user not found

---

## `GET /chat`

List persisted chat messages for the **origin** of the given page URL.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Query**

| Param | Required | Description |
| ----- | -------- | ----------- |
| `tabUrl` | Yes | Any page URL on the target origin |

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `originId` | `string` \| `null` | Origin row id, or `null` if none yet |
| `origin` | `string` \| `null` | URL origin, or `null` if none yet |
| `tabUrl` | `string` | Echo of the query param |
| `messages` | `array` | Chat messages ordered by `createdAt` |

Each message:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Message UUID |
| `role` | `string` | `user` \| `ezer` |
| `messageType` | `string` | `CAPTURE` \| `TEXT` |
| `content` | `string` | Plain text or JSON (`CAPTURE`) |
| `createdAt` | `string` | ISO 8601 timestamp |

**Errors:** `400` missing or invalid `tabUrl` · `401` invalid header

---

## `POST /chat`

Send a typed message to the Ezer assistant. Persists the user message and Ezer reply in the `chat` table.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Request body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `message` | `string` | Yes | Non-empty user message (whitespace trimmed) |
| `tabUrl` | `string` | Yes | Active page URL (origin is parsed from this) |

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `originId` | `string` | Origin row id |
| `origin` | `string` | URL origin, e.g. `https://github.com` |
| `reply` | `string` | Assistant reply (markdown allowed) |
| `rejected` | `boolean` | `true` if the message was off-topic |
| `userMessageId` | `string` | Saved user `TEXT` chat id |
| `ezerMessageId` | `string` | Saved Ezer `TEXT` reply id |

**Errors:** `400` invalid body · `401` invalid header · `502` LLM failed · `503` LLM not configured

---

## `DELETE /chat/:id`

Soft-delete a chat message owned by the authenticated user.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Path**

| Param | Description |
| ----- | ----------- |
| `id` | Chat message UUID |

**Response `204`** — no body.

**Errors:** `401` invalid header · `404` message not found · `409` message is a capture linked to a task

---

## `POST /captures`

Parse a highlighted text selection into a reminder or note. Persists chat messages and a task row, scoped to the **origin** derived from `tabUrl`. If the LLM call fails or returns invalid JSON, the server saves a generic **note** fallback and still returns `200`.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Request body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `text` | `string` | Yes | Selected text |
| `tabUrl` | `string` | Yes | Active page URL (origin is parsed from this) |
| `url` | `string` | No | Source page URL for the selection |
| `title` | `string` | No | Source page title |
| `timezone` | `string` | No | IANA timezone for due-date parsing |

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `taskId` | `string` | Saved task id |
| `originId` | `string` | Origin row id for this domain |
| `origin` | `string` | URL origin, e.g. `https://github.com` |
| `item` | `object` | Extracted task (`id`, `kind`, `title`, `dueAt`, `summary`) |
| `reply` | `string` | Markdown reply for chat |
| `userMessageId` | `string` | Saved user `CAPTURE` chat id |
| `ezerMessageId` | `string` | Saved Ezer `TEXT` reply id |

**Errors:** `400` invalid body or `tabUrl` · `401` invalid header · `500` persist failed · `503` LLM not configured

---

## `GET /workflow`

List saved workflows for the **origin** of the given page URL.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Query**

| Param | Required | Description |
| ----- | -------- | ----------- |
| `tabUrl` | Yes | Any page URL on the target origin |

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `originId` | `string` \| `null` | Origin row id, or `null` if none yet |
| `origin` | `string` \| `null` | URL origin, or `null` if none yet |
| `tabUrl` | `string` | Echo of the query param |
| `workflows` | `array` | Workflows ordered by `createdAt` descending |

Each workflow:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Workflow UUID |
| `originId` | `string` | Origin row id |
| `origin` | `string` | URL origin |
| `name` | `string` | User-given name |
| `actions` | `array` | Recorded DOM actions (`CLICK`, `INPUT`, `SUBMIT`) |
| `createdAt` | `string` | ISO 8601 timestamp |

Each action:

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `type` | `string` | Yes | `CLICK` \| `INPUT` \| `SUBMIT` |
| `selectors` | `string[]` | Yes | Priority-ordered selector chain |
| `tagName` | `string` | Yes | Element tag name |
| `value` | `string` | No | Input value (`INPUT`) |
| `checked` | `boolean` | No | Checkbox state (`INPUT`) |
| `innerText` | `string` | No | Truncated label text (`CLICK`) |

**Errors:** `400` missing or invalid `tabUrl` · `401` invalid header

---

## `GET /workflow/:id`

Get a single workflow by id.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Path**

| Param | Description |
| ----- | ----------- |
| `id` | Workflow UUID |

**Response `200`** — single workflow object (same shape as items in `GET /workflow`).

**Errors:** `401` invalid header · `404` workflow not found

---

## `POST /workflow`

Save a recorded workflow, scoped to the **origin** derived from `tabUrl`.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Request body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | `string` | Yes | Workflow name |
| `tabUrl` | `string` | Yes | Active page URL (origin is parsed from this) |
| `actions` | `array` | Yes | Recorded actions (see `GET /workflow`) |

**Response `201`** — saved workflow object.

**Errors:** `400` invalid body · `401` invalid header · `500` persist failed

---

## `GET /task`

List tasks for the **origin** of the given page URL.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Query**

| Param | Required | Description |
| ----- | -------- | ----------- |
| `tabUrl` | Yes | Any page URL on the target origin |
| `status` | No | Filter by `active`, `done`, or `dismissed` |

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `originId` | `string` \| `null` | Origin row id, or `null` if none yet |
| `origin` | `string` \| `null` | URL origin, or `null` if none yet |
| `tabUrl` | `string` | Echo of the query param |
| `tasks` | `array` | Tasks ordered by `createdAt` descending |

Each task:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | Task UUID |
| `originId` | `string` | Origin row id |
| `origin` | `string` | URL origin |
| `chatId` | `string` \| `null` | Linked `CAPTURE` chat id, if any |
| `kind` | `string` | `reminder` \| `note` |
| `title` | `string` | Short label |
| `summary` | `string` \| `null` | One-line description |
| `dueAt` | `string` \| `null` | ISO 8601 datetime for reminders |
| `status` | `string` | `active` \| `done` \| `dismissed` |
| `sourceUrl` | `string` \| `null` | Page URL where captured |
| `sourceTitle` | `string` \| `null` | Page title at capture time |
| `createdAt` | `string` | ISO 8601 timestamp |

**Errors:** `400` missing or invalid `tabUrl` · `401` invalid header

---

## `GET /task/:id`

Get a single task by id.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Path**

| Param | Description |
| ----- | ----------- |
| `id` | Task UUID |

**Response `200`** — single task object (same shape as items in `GET /task`).

**Errors:** `401` invalid header · `404` task not found

---

## `POST /task`

Create a task manually (captures via `POST /captures` also create tasks via the LLM).

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Request body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `kind` | `string` | Yes | `reminder` \| `note` |
| `title` | `string` | Yes | Short label |
| `tabUrl` | `string` | Yes | Active page URL (origin is parsed from this) |
| `summary` | `string` | No | One-line description |
| `dueAt` | `string` \| `null` | No | ISO 8601 datetime |
| `sourceUrl` | `string` | No | Source page URL |
| `sourceTitle` | `string` | No | Source page title |

**Response `201`** — created task object.

**Errors:** `400` invalid body · `401` invalid header · `500` persist failed

---

## `PATCH /task/:id`

Update a task (e.g. mark done or dismissed).

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Path**

| Param | Description |
| ----- | ----------- |
| `id` | Task UUID |

**Request body** — at least one field:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `status` | `string` | `active` \| `done` \| `dismissed` |
| `kind` | `string` | `reminder` \| `note` |
| `title` | `string` | Updated title |
| `summary` | `string` \| `null` | Updated summary |
| `dueAt` | `string` \| `null` | Updated due date |

**Response `200`** — updated task object.

**Errors:** `400` invalid body · `401` invalid header · `404` task not found

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled output |
| `npm run typecheck` | TypeScript check |
