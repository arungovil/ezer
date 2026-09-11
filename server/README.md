# Ezer Server

Thin Express API for LLM-backed chat and workflow compilation. Default base URL: `http://localhost:3000`.

## Setup

```bash
npm install
cp .env.example .env   # add LLM_API_KEY
npm run dev              # watch mode
```

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `LLM_API_KEY` | Yes (for `/chat`) | — | DeepSeek (or other OpenAI-compatible) API key |
| `LLM_BASE_URL` | No | `https://api.deepseek.com` | LLM API base URL |
| `LLM_MODEL` | No | `deepseek-chat` | Model name |
| `PORT` | No | `3000` | HTTP port |

## API overview

| Method | Path | Status | Description |
| ------ | ---- | ------ | ----------- |
| `GET` | `/health` | Live | Liveness check |
| `POST` | `/chat` | Live | Ezer-scoped assistant chat |
| `POST` | `/api/compile` | Stub | Compile raw events → workflow AST |

All endpoints accept and return JSON. CORS is enabled for local extension development.

### Error responses

When a request fails, the body is:

```json
{ "error": "human-readable message" }
```

---

## `GET /health`

Liveness probe for hosting and local dev.

**Response `200`**

```json
{ "status": "ok" }
```

**Example**

```bash
curl http://localhost:3000/health
```

---

## `POST /chat`

Send a user message to the Ezer assistant. Off-topic questions (general knowledge, unrelated coding help, etc.) are answered with a polite decline; the response still returns `200` with `rejected: true`.

**Request body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `message` | `string` | Yes | Non-empty user message (whitespace trimmed) |

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `reply` | `string` | Assistant reply (markdown allowed) |
| `rejected` | `boolean` | `true` if the message was off-topic |

**Errors**

| Status | When |
| ------ | ---- |
| `400` | Missing or empty `message` |
| `502` | LLM call or response validation failed |
| `503` | `LLM_API_KEY` not set |

**Example**

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is Ezer?"}'
```

```json
{
  "reply": "Ezer is a Chrome extension that records browser interactions…",
  "rejected": false
}
```

---

## `POST /api/compile`

Compile raw browser interaction events into a workflow AST. **Currently a stub** — returns an empty AST; LLM compile and validation are not implemented yet.

**Request body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `rawEvents` | `array` | Yes | Recorded interaction events from the extension |

**Response `200` (stub)**

```json
{
  "workflowName": "untitled",
  "description": "stub AST",
  "steps": []
}
```

**Target AST shape** (when compile is implemented):

```json
{
  "workflowName": "string",
  "description": "string",
  "steps": [
    {
      "stepNumber": 1,
      "action": "CLICK",
      "selectors": ["#submit"],
      "description": "Click submit button"
    },
    {
      "stepNumber": 2,
      "action": "INPUT",
      "selectors": ["input[name=email]"],
      "value": "user@example.com",
      "description": "Enter email"
    }
  ]
}
```

- `action` is `"CLICK"` or `"INPUT"`.
- `selectors` is priority-ordered for the same element (`selectors[0]` is primary).
- `value` is optional; used on `INPUT` steps only.

**Errors**

| Status | When |
| ------ | ---- |
| `400` | `rawEvents` missing or not an array |

**Example**

```bash
curl -X POST http://localhost:3000/api/compile \
  -H "Content-Type: application/json" \
  -d '{"rawEvents":[]}'
```

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled output |
| `npm run typecheck` | TypeScript check |
