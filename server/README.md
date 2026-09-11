# Ezer Server

Express API for LLM-backed capture extraction and chat. Default base URL: `http://localhost:3000`.

## Setup

```bash
npm install
cp .env.example .env   # add LLM_API_KEY
npm run dev              # watch mode
```

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `LLM_API_KEY` | Yes (for `/chat`, `/captures`) | — | DeepSeek (or other OpenAI-compatible) API key |
| `LLM_BASE_URL` | No | `https://api.deepseek.com` | LLM API base URL |
| `LLM_MODEL` | No | `deepseek-chat` | Model name |
| `PORT` | No | `3000` | HTTP port |
| `DB_PATH` | No | `./data/ezer.sqlite` | SQLite database file |

## API overview

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | Liveness check |
| `POST` | `/chat` | Ezer-scoped assistant chat |
| `POST` | `/captures` | Extract and store a text selection |
| `GET` | `/conversations/messages?tabUrl=` | Load chat for a tab |

All endpoints accept and return JSON. `/captures` and `/conversations/messages` require `X-Ezer-User-Id: <uuid>`. CORS is enabled for local extension development.

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

---

## `POST /chat`

Send a user message to the Ezer assistant.

**Request body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `message` | `string` | Yes | Non-empty user message (whitespace trimmed) |

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `reply` | `string` | Assistant reply (markdown allowed) |
| `rejected` | `boolean` | `true` if the message was off-topic |

---

## `POST /captures`

Parse a highlighted text selection into a task, reminder, or note. Persists the capture, extracted item, and chat messages.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Request body**

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `text` | `string` | Yes | Selected text |
| `tabUrl` | `string` | Yes | Conversation key (active tab URL) |
| `url` | `string` | No | Source page URL |
| `title` | `string` | No | Source page title |
| `timezone` | `string` | No | IANA timezone for due-date parsing |

**Response `200`**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `captureId` | `string` | Saved capture id |
| `conversationId` | `string` | Conversation id for this tab |
| `item` | `object` | Extracted item (`kind`, `title`, `dueAt`, `summary`) |
| `reply` | `string` | Markdown reply for chat |
| `userMessageId` | `string` | Saved user message id |
| `ezerMessageId` | `string` | Saved Ezer reply id |

---

## `GET /conversations/messages`

Load persisted chat messages for a tab.

**Headers**

| Header | Required | Description |
| ------ | -------- | ----------- |
| `X-Ezer-User-Id` | Yes | Client UUID |

**Query**

| Param | Required | Description |
| ----- | -------- | ----------- |
| `tabUrl` | Yes | Active tab URL |

**Response `200`**

```json
{
  "conversationId": "uuid-or-null",
  "tabUrl": "https://example.com",
  "messages": []
}
```

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled output |
| `npm run typecheck` | TypeScript check |
