# Task routes

Notes and reminders, scoped to the origin of a page URL. Captures create tasks via the LLM; these
routes list, read, create, and update them.

Auth: `X-Ezer-User-Id` (see [README.md](README.md#conventions)).

## `GET /task`

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

> The full captured text is stored as `task.body` for the assistant's search, but is **not** part of
> the API response.

**Errors:** `400` missing or invalid `tabUrl` · `401` invalid header

## `GET /task/:id`

Get a single task by id.

**Path**

| Param | Description |
| ----- | ----------- |
| `id` | Task UUID |

**Response `200`** — single task object (same shape as items in `GET /task`).

**Errors:** `401` invalid header · `404` task not found

## `POST /task`

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

## `PATCH /task/:id`

Update a task (e.g. mark done or dismissed). At least one field is required.

**Path**

| Param | Description |
| ----- | ----------- |
| `id` | Task UUID |

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
