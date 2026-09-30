# Ezer HTTP API

Express routes for users, captures, chat, and tasks. All routes are registered in `index.ts`; each
route file exports its handlers.

> **API docs:** Document every new route here — or in the matching resource file — with headers,
> request/response shapes, and error codes.

Base URL: `http://localhost:3000`. See [../../README.md](../../README.md) for setup and env.

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

| Method | Path | Description | Details |
| ------ | ---- | ----------- | ------- |
| `GET` | `/health` | Liveness check | below |
| `GET` | `/user` | Get current user | [user.md](user.md) |
| `PUT` | `/user` | Register or sync current user | [user.md](user.md) |
| `DELETE` | `/user` | Soft-delete user and all owned data | [user.md](user.md) |
| `GET` | `/chat?tabUrl=` | List chat messages for an origin | [chat.md](chat.md) |
| `POST` | `/chat` | Grounded chat or menu `action` (`notes` / `reminders` / `help`) | [chat.md](chat.md) |
| `DELETE` | `/chat/:id` | Soft-delete a chat message | [chat.md](chat.md) |
| `POST` | `/captures` | Extract and store a text selection | [capture.md](capture.md) |
| `GET` | `/task?tabUrl=` | List tasks for an origin | [task.md](task.md) |
| `GET` | `/task/:id` | Get one task | [task.md](task.md) |
| `POST` | `/task` | Create a task | [task.md](task.md) |
| `PATCH` | `/task/:id` | Update a task | [task.md](task.md) |

---

## `GET /health`

Liveness probe for hosting and local dev.

**Response `200`**

```json
{ "status": "ok" }
```
