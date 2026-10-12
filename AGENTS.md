# Ezer

Chrome side-panel assistant: capture selections as notes or reminders; chat grounded in notes saved
for the current site.

## Principles

- **Depth over breadth** — own one genuinely hard problem instead of skimming ten
- **Real world first** — malformed input, timeouts, concurrency: degrade gracefully, don't fall over
- **Deliberate calls** — product, UX, and infra decisions reasoned in code or PRs where it matters
- **Trustworthy by default** — clear errors, one-shot setup, tests that catch real failures
- **The whole journey** — first-run, empty states, error moments, small touches

## Stack & layout

| Path                     | Role                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `client/src/background/` | MV3 service worker: messages, capture dedupe, side-panel-open check                                                    |
| `client/src/content/`    | MV3 content script; `capture-engine/` handles selection                                                                |
| `client/src/sidepanel/`  | Panel API, capture helpers, domain types (no UI)                                                                       |
| `client/src/ui/`         | Side panel React UI (`components/`, `hooks/`)                                                                          |
| `client/src/shared/`     | Cross-context only: `message-constants.ts`, `identity/user-store.ts`                                                   |
| `server/`                | Go + chi: `cmd/` (handlers), `internal/core` (DB + logic), `models/`, `queries/*.sql`, `internal/llm` |

Dev: server `localhost:3000`; extension loaded unpacked from `client/`. Human docs:
[README.md](README.md), [server/README.md](server/README.md).

## Contracts

**Auth:** `X-Ezer-User-Id` (client UUID) on user-scoped routes.

**Kinds:** `note` \| `reminder` per capture; reminders may include `dueAt` (ISO 8601, user timezone).

**`POST /captures`** — `{ text, tabUrl, url?, title?, timezone? }` → task + chat rows. LLM failure →
generic note, still `200`.

**`POST /chat`** — `{ message, tabUrl, action? }`. Without `action`: classify → FTS5 → grounded reply
(`rejected` when `out_of_scope`). With `action` (`notes` \| `reminders` \| `help`): server markdown, no
LLM. Details: [server/docs/api.md](server/docs/api.md),
[server/docs/chat-pipeline.md](server/docs/chat-pipeline.md).

**History / tasks:** `GET /chat?tabUrl=`, `GET /task?tabUrl=`, `PATCH /task/:id`.

**Persistence:** `user`, `origin`, `chat`, `task`, `task_fts`; soft delete via `deleted_at` —
[server/docs/database.md](server/docs/database.md).

## Conventions

### Code style

| Rule                  | Convention                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Files                 | `kebab-case.ts` / `kebab-case.tsx`; UI components live in a folder with `index.tsx` and `styles.module.css` |
| Classes / components  | `PascalCase` (`ChatHeader`)                                                                                 |
| Functions / variables | `camelCase`; handlers → `handle*`                                                                           |
| Constants             | `camelCase`                                                                                                 |
| Exports               | Named only, no default exports                                                                              |
| Imports               | Ext libs → internal → siblings (`.ts` for local TS)                                                         |
| TS strict             | No `any` except deliberate boundary loose ends                                                              |
| Comments              | _Why_, not _what_                                                                                           |
| Logs                  | No `console` in committed code                                                                              |
| Errors                | Degrade gracefully — catch, surface to UI                                                                   |

Biome: formatting, quotes, semicolons, trailing commas, 100-col width.

### Server (Go)

Thin handlers on `App` in `cmd/`; `internal/core` owns DB access and logic and returns `*HTTPError`s
the handler sends as is (the cause is logged there, never sent); one `models` struct carries both
`db` and `json` tags; SQL lives in `queries/*.sql` as named queries bound to `models.Queries`. Doc
comment on every function, starting with its name. chi (not echo) and the existing wire contract are
kept. `gofmt`/`go vet` clean and `make test` (race detector) before commit. Request bodies are
decoded leniently (unknown fields ignored) because extension and server ship separately. The TS
table above applies to `client/` only.

### Styling

Design tokens in `client/styles.css` as CSS custom properties; React UI uses CSS modules
(`styles.module.css`) and `var(--token-name)` only.
