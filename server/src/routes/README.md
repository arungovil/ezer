# HTTP API

Handlers live in this folder; wiring in `index.ts`. Add new routes here (shapes + errors).

Setup and env: [../../README.md](../../README.md). Typed chat behavior:
[../services/README.md](../services/README.md).

## Conventions

- **Auth:** user-scoped routes require `X-Ezer-User-Id: <uuid-v4>`.
- **Content type:** JSON requests and responses use `Content-Type: application/json`.
- **CORS:** enabled for local extension development.
- **Soft delete:** `DELETE` never removes rows. It sets `deleted_at` (ISO 8601); all reads filter
  `deleted_at IS NULL`.

### Errors

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
| `502` | LLM request failed (`POST /chat`) |
| `503` | `LLM_API_KEY` not configured (typed `POST /chat` only; `action` on `/chat` does not need LLM) |

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | Liveness check |
| `GET` | `/user` | Get current user |
| `PUT` | `/user` | Register or sync current user |
| `DELETE` | `/user` | Soft-delete user and all owned data |
| `GET` | `/chat?tabUrl=` | List chat messages for an origin |
| `POST` | `/chat` | Grounded chat or menu `action` (`notes` / `reminders` / `help`) |
| `DELETE` | `/chat/:id` | Soft-delete a chat message |
| `POST` | `/captures` | Extract and store a text selection |
| `GET` | `/task?tabUrl=` | List tasks for an origin |
| `GET` | `/task/:id` | Get one task |
| `POST` | `/task` | Create a task |
| `PATCH` | `/task/:id` | Update a task |

---

## `GET /health`

Liveness probe for hosting and local dev.

**Response `200`**

```json
{ "status": "ok" }
```

## User

Client identity.

### `GET /user`

Return the authenticated user. Does **not** create a row — use `PUT /user` to register.

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | User UUID |
| `createdAt` | `string` | ISO 8601 timestamp |

**Errors:** `401` invalid header · `404` user not registered

### `PUT /user`

Register the client identity on the server (idempotent).

**Response `200`** — same shape as `GET /user`.

**Errors:** `401` invalid header · `500` persist failed

### `DELETE /user`

Soft-delete the user and all owned data (origins, chats, tasks). Rows remain in SQLite with
`deleted_at` set.

**Irreversible from the product's perspective** — re-registering clears `deleted_at` on the user row
and revisiting a site restores the origin shell, but cascaded chat/task rows stay hidden.

**Response `204`** — no body.

**Errors:** `401` invalid header · `404` user not found

## Chat

Scoped to the origin of a page URL. Typed `POST /chat` answers **only** from notes saved on that
origin.

### `GET /chat`

List persisted chat messages for the **origin** of the given page URL.

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
| `messageType` | `string` | `CAPTURE` \| `TEXT` \| `QUICK_ACTION` |
| `content` | `string` | Plain text or JSON (`CAPTURE`) |
| `createdAt` | `string` | ISO 8601 timestamp |

**Errors:** `400` missing or invalid `tabUrl` · `401` invalid header

### `POST /chat`

Without `action`: grounded assistant (`TEXT` messages, optional `agent_state`) — see
[../services/README.md](../services/README.md). With `action` (`notes` \| `reminders` \| `help`):
server-built markdown, `QUICK_ACTION` messages, no LLM, `rejected` always `false`.

**Request body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `message` | `string` | Yes | Non-empty user message (whitespace trimmed) |
| `tabUrl` | `string` | Yes | Active page URL (origin is parsed from this) |
| `action` | `string` | No | `notes` \| `reminders` \| `help` — server-built reply from tasks or product help; no LLM |

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `originId` | `string` | Origin row id |
| `origin` | `string` | URL origin, e.g. `https://github.com` |
| `reply` | `string` | Assistant reply (markdown allowed). Fallback when `content` is absent or for plain-text consumers |
| `content` | `object` | Optional structured payload (`format`: `markdown` \| `taskList`). Menu actions: always set. Typed chat: omitted today; same shape when prompts return structured UI |
| `rejected` | `boolean` | Typed chat: `true` when classified `out_of_scope`. Menu `action`: always `false` |
| `userMessageId` | `string` | Saved user message id (`TEXT` or `QUICK_ACTION`) |
| `ezerMessageId` | `string` | Saved assistant reply id (`TEXT` or `QUICK_ACTION`) |

**Errors:** `400` invalid body · `401` invalid header · `502` LLM failed · `503` LLM not configured (typed chat only; `action` works without LLM)

### `DELETE /chat/:id`

Soft-delete a chat message owned by the authenticated user.

**Path:** `id` — chat message UUID.

**Response `204`** — no body.

**Errors:** `401` invalid header · `404` message not found · `409` message is a capture linked to a task

## Capture

### `POST /captures`

Parse a highlighted text selection into a **note**, or a **reminder** when it is something to do.
Persists chat messages and a task row, scoped to the **origin** derived from `tabUrl`.

If the LLM call fails or returns invalid JSON, the server saves a generic **note** fallback and still
returns `200`. The full selected text is stored on the task as `body` and indexed for the assistant's
note search.

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
| `ezerMessageId` | `string` | Saved assistant `TEXT` reply id |

**Errors:** `400` invalid body or `tabUrl` · `401` invalid header · `500` persist failed · `503` LLM not configured

## Task

Notes and reminders for the origin of a page URL.

### `GET /task`

List tasks for the **origin** of the given page URL.

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

Each task (`TaskResponseBody`):

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

The full captured text is stored as `task.body` for the assistant's search, but is **not** part of the
API response.

**Errors:** `400` missing or invalid `tabUrl` · `401` invalid header

### `GET /task/:id`

Get a single task by id.

**Path:** `id` — task UUID.

**Response `200`** — single task object (same shape as items in `GET /task`).

**Errors:** `401` invalid header · `404` task not found

### `POST /task`

Create a task manually (captures via `POST /captures` also create tasks via the LLM).

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

### `PATCH /task/:id`

Update a task (e.g. mark done or dismissed). At least one field is required.

**Path:** `id` — task UUID.

**Request body**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `status` | `string` | `active` \| `done` \| `dismissed` |
| `kind` | `string` | `reminder` \| `note` |
| `title` | `string` | Updated title |
| `summary` | `string` \| `null` | Updated summary |
| `dueAt` | `string` \| `null` | Updated due date |

**Response `200`** — updated task object.

**Errors:** `400` invalid body · `401` invalid header · `404` task not found
