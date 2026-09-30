# Capture route

Turn a highlighted text selection into a saved note, or a reminder when it is something to do.

Auth: `X-Ezer-User-Id` (see [README.md](README.md#conventions)).

## `POST /captures`

Parse a highlighted text selection into a note, or a reminder when it is something to do. Persists
chat messages and a task row, scoped to the **origin** derived from `tabUrl`.

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
