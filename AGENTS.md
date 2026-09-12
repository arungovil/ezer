# Ezer

Ezer is a Chrome side-panel personal and professional assistant. Its core job is capturing what
you find while browsing and turning it into tasks, reminders, and notes; it can also learn
workflows by recording browser interactions and replaying them for you. More use cases are on the
way.

## Principles

- **Depth over breadth** — own one genuinely hard problem instead of skimming ten
- **Real world first** — malformed input, timeouts, concurrency: degrade gracefully, don't fall over
- **Deliberate calls** — every product, UX, and infra decision is reasoned and documented in code or PRs where it matters
- **Trustworthy by default** — observability, clear errors, one-shot setup, tests that catch real failures
- **The whole journey** — first-run, empty states, error moments, small touches

## Features

### Personal assistant

- Capture text selections from any page (independent of workflow recording)
- Classify each capture as a `task` | `reminder` | `note` and extract title, due date, and summary via LLM
- Persist captures, items, and per-tab chat in SQLite
- Roadmap: notify the user when a due task or reminder comes up

### Workflow automation

- Record `click` / `change` / `submit` on the capture phase
- Map each event to a `RecordedAction` with a priority-ordered selector chain
- Save named workflows locally in IndexedDB, scoped per tab
- Replay saved workflows with synthetic DOM events

## Stack & Layout

- `client/src/background/` — MV3 service worker: recording buffer, message routing
- `client/src/content/` — MV3 content script: `workflow/` (record + replay engine), `capture/` (selection)
- `client/src/sidepanel/` — MV3 side panel: `components/`, `api/`, `workflow/`, `capture/`
- `client/src/shared/` — cross-layer types, message constants, replay failure shapes
- `server/` — Express: `/captures`, `/chat`, `/conversations/messages`, SQLite persistence (assistant feature)
- LLM: DeepSeek (`deepseek-chat`, OpenAI-compatible API) with structured JSON output
- Dev env: server on `localhost:3000`; extension loaded unpacked in Chrome

## Contracts

### Personal assistant

- **Item kinds:** `task` | `reminder` | `note` — one per capture; `reminder` carries `dueAt` (ISO 8601, resolved in the user's timezone)
- **Capture:** `POST /captures` with `{ text, tabUrl, url?, title?, timezone? }` → `{ captureId, conversationId, item, reply, userMessageId, ezerMessageId }`
- **Chat:** `POST /chat` with `{ message }` → `{ reply, rejected }` (off-topic guard)
- **History:** `GET /conversations/messages?tabUrl=` → per-tab messages; `/captures` and `/conversations/messages` require `X-Ezer-User-Id`
- **Persistence:** SQLite tables for users, conversations, messages, captures, items

### Workflow automation

- **Recorded action:** `{ type: CLICK|INPUT|SUBMIT, selectors: string[], value?, checked?, innerText?, tagName }` — `selectors` ordered by priority; `selectors[0]` is primary
- **Selector chain:** `data-testid` → `id` → `name` → `aria-label` → `placeholder` → `[type]` → tag name
- **Workflow:** `{ id, tabId, url, name, actions: RecordedAction[], createdAt }` — stored in IndexedDB, scoped per tab
- **Replay:** resolve via `querySelector(selectors[0])`, falling back down the chain; INPUT → set value via native setter (`Object.getOwnPropertyDescriptor`) + dispatch input/change (React/Vue controlled inputs); CLICK/SUBMIT → scrollIntoView + click(); 800ms between steps
- **Replay errors:** selector unresolved → retry up to 3× over the selector chain; if still unresolvable, stop the run and surface an error message naming the failed step and suggesting a fix
- **Messages:** `START_RECORDING`, `STOP_RECORDING`, `REPLAY_ACTIONS`, `ACTION_CAPTURED`, `GET_RECORDING_STATE`, `REPLAY_COMPLETE`, `REPLAY_FAILED`, `RECORDING_COMPLETE` via background broker

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

### Extension

- Selector priority (recorded per step): `data-testid` > `id` > `name` > `aria-label` > `placeholder` > `[type]` > tag name
- Record `click` / `change` / `submit` on the capture phase; truncate innerText to 50 chars
