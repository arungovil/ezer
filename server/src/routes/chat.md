# Chat routes

The Ezer assistant, scoped to the origin of a page URL. It answers **only** from the notes saved on
that origin — see [../services/README.md](../services/README.md) for the classify → retrieve →
answer pipeline.

Auth: `X-Ezer-User-Id` (see [README.md](README.md#conventions)).

## `GET /chat`

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

## `POST /chat`

Two modes, same response shape:

1. **Typed chat** (no `action`) — classifies the message (`specific` | `summary` | `out_of_scope`),
   retrieves matching notes with SQLite FTS5, then phrases a reply. Off-topic messages get a canned
   refusal; a search with no hits gets a canned "nothing found". Persists `TEXT` messages; assistant
   rows may include `agent_state`.
2. **Menu actions** (`action` set) — server-built markdown reply (`notes`, `reminders`, or product
   `help`) from tasks / config; **no LLM**. Persists `QUICK_ACTION` messages; `rejected` is always
   `false`.

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
| `reply` | `string` | Assistant reply (markdown allowed) |
| `rejected` | `boolean` | Typed chat: `true` when classified `out_of_scope`. Menu `action`: always `false` |
| `userMessageId` | `string` | Saved user message id (`TEXT` or `QUICK_ACTION`) |
| `ezerMessageId` | `string` | Saved assistant reply id (`TEXT` or `QUICK_ACTION`) |

**Errors:** `400` invalid body · `401` invalid header · `502` LLM failed · `503` LLM not configured (typed chat only; `action` works without LLM)

## `DELETE /chat/:id`

Soft-delete a chat message owned by the authenticated user.

**Path**

| Param | Description |
| ----- | ----------- |
| `id` | Chat message UUID |

**Response `204`** — no body.

**Errors:** `401` invalid header · `404` message not found · `409` message is a capture linked to a task
