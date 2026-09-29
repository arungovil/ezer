# Ezer

Ezer is a Chrome side-panel personal assistant. Its core job is capturing what you find while
browsing and saving it as a note, or as a reminder when the selection is something to act on.

## Principles

- **Depth over breadth** — own one genuinely hard problem instead of skimming ten
- **Real world first** — malformed input, timeouts, concurrency: degrade gracefully, don't fall over
- **Deliberate calls** — every product, UX, and infra decision is reasoned and documented in code or PRs where it matters
- **Trustworthy by default** — observability, clear errors, one-shot setup, tests that catch real failures
- **The whole journey** — first-run, empty states, error moments, small touches

## Features

### Notes and reminders

- Capture text selections from any page
- Save each capture as a `note` by default; use `reminder` when the text is something to do, and set `dueAt` when a date or time is present
- Persist captures, tasks, and per-origin chat in SQLite
- Roadmap: notify the user when a due reminder comes up

## Stack & Layout

- `client/src/background/` — MV3 service worker: message routing, capture dedupe
- `client/src/content/` — MV3 content script: `capture/` (selection)
- `client/src/sidepanel/` — MV3 side panel: `components/`, `api/`, `capture/`
- `client/src/shared/` — cross-layer types, message constants
- `server/` — Express: `/captures`, `/chat`, `/task`, `/user`, SQLite persistence
- LLM: DeepSeek (`deepseek-chat`, OpenAI-compatible API) with structured JSON output
- Dev env: server on `localhost:3000`; extension loaded unpacked in Chrome

## Contracts

### Notes and reminders

- **Item kinds:** `note` | `reminder` — one per capture. Notes are the default. A `reminder` is for something to do and may carry `dueAt` (ISO 8601, resolved in the user's timezone)
- **Capture:** `POST /captures` with `{ text, tabUrl, url?, title?, timezone? }` → `{ taskId, originId, origin, item, reply, userMessageId, ezerMessageId }`. LLM failures degrade to a generic note (always `200` on success path).
- **Chat:** `POST /chat` with `{ message, tabUrl }` → `{ originId, origin, reply, rejected, userMessageId, ezerMessageId }` (off-topic guard)
- **History:** `GET /chat?tabUrl=` → per-origin messages; authenticated routes require `X-Ezer-User-Id`
- **Tasks:** `GET /task?tabUrl=`, `PATCH /task/:id` — notes and reminders for the page origin
- **Persistence:** SQLite tables `user`, `origin`, `chat`, `task` (soft delete via `deleted_at`)

## Conventions

### Code style

| Rule                  | Convention                                        |
| --------------------- | ------------------------------------------------- |
| Files                 | `kebab-case.ts`                                   |
| Classes / components  | `PascalCase` (`EzerChat`)                         |
| Functions / variables | `camelCase`; handlers → `handle*`                 |
| Constants             | `camelCase`                                       |
| Exports               | Named only, no default exports                    |
| Imports               | Ext libs → internal → siblings (`.js` ext for TS) |
| TS strict             | No `any` except deliberate boundary loose ends    |
| Functions             | Small, single-purpose; name over block comment    |
| Comments              | _Why_, not _what_. Code is the _what_.            |
| Logs                  | No `console` in committed code                    |
| Errors                | Degrade gracefully — catch, surface to UI         |

Auto-enforced (Biome): formatting, quotes, semicolons, trailing commas, 100-col width.

### Styling

Design tokens via CSS custom properties in `styles.css`. All Lit components reference `var(--token-name)` only. Tokens cascade through Shadow DOM automatically.
