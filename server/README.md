# Ezer Server

Express API for the personal-assistant feature: LLM-backed capture extraction (`task` | `reminder` | `note`), per-origin chat persistence, and user identity. Workflow replay remains client-side (IndexedDB) until the `workflow` table is wired up.

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
| `/chat`, `/captures`, `/workflow` | `requireUser` | Validates header and auto-registers the user if missing |
| `/health` | — | No auth |

Register explicitly with `PUT /user` on first run. Other routes will create the user row on first use.

## API overview

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/health` | — | Liveness check |
| `GET` | `/user` | `X-Ezer-User-Id` | Get current user |
| `PUT` | `/user` | `X-Ezer-User-Id` | Register or sync current user |
| `DELETE` | `/user` | `X-Ezer-User-Id` | Delete user and all owned data |
| `GET` | `/chat?tabUrl=` | `X-Ezer-User-Id` | List chat messages for an origin |
| `POST` | `/chat` | `X-Ezer-User-Id` | Send a message and persist the reply |
| `DELETE` | `/chat/:id` | `X-Ezer-User-Id` | Delete a chat message |
| `POST` | `/captures` | `X-Ezer-User-Id` | Extract and store a text selection |
| `GET` | `/workflow?tabUrl=` | `X-Ezer-User-Id` | List workflows for an origin |
| `GET` | `/workflow/:id` | `X-Ezer-User-Id` | Get one workflow |
| `POST` | `/workflow` | `X-Ezer-User-Id` | Save a workflow |

All JSON endpoints use `Content-Type: application/json`. CORS is enabled for local extension development.

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
| `502` | LLM request failed |
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

Delete the user and all owned data (origins, chats, tasks, workflows).

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

Delete a chat message owned by the authenticated user.

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

Parse a highlighted text selection into a task, reminder, or note. Persists chat messages and a task row, scoped to the **origin** derived from `tabUrl`.

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

**Errors:** `400` invalid body · `401` invalid header · `502` LLM failed · `503` LLM not configured

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

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled output |
| `npm run typecheck` | TypeScript check |
