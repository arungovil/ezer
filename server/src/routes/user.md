# User routes

Client identity. Auth: `X-Ezer-User-Id` (see [README.md](README.md#conventions)).

## `GET /user`

Return the authenticated user. Does **not** create a row — use `PUT /user` to register.

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `string` | User UUID |
| `createdAt` | `string` | ISO 8601 timestamp |

**Errors:** `401` invalid header · `404` user not registered

## `PUT /user`

Register the client identity on the server (idempotent).

**Response `200`** — same shape as `GET /user`.

**Errors:** `401` invalid header · `500` persist failed

## `DELETE /user`

Soft-delete the user and all owned data (origins, chats, tasks). Rows remain in SQLite with
`deleted_at` set.

**Irreversible from the product's perspective** — re-registering clears `deleted_at` on the user row
and revisiting a site restores the origin shell, but cascaded chat/task rows stay hidden.

**Response `204`** — no body.

**Errors:** `401` invalid header · `404` user not found
