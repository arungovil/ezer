# Ezer

Browser automation, done properly: record real interactions in a Chrome extension, compile them into a validated workflow AST with an LLM, and replay them via synthetic DOM events.

## Principles

- **Depth over breadth** — own one genuinely hard problem instead of skimming ten
- **Real world first** — malformed input, timeouts, concurrency: degrade gracefully, don't fall over
- **Deliberate calls** — every product, UX, and infra decision is reasoned and documented in code or PRs where it matters
- **Trustworthy by default** — observability, clear errors, one-shot setup, tests that catch real failures
- **The whole journey** — first-run, empty states, error moments, small touches

## Stack & Layout

- `client/src/background/` — MV3 service worker: recording buffer, message routing
- `client/src/content/` — MV3 content script: `workflow/` (record + replay engine), `capture/` (selection)
- `client/src/sidepanel/` — MV3 side panel: `components/`, `api/`, `workflow/`, `capture/`
- `client/src/shared/` — cross-layer types, message constants, replay failure shapes
- `server/` — Express: `/captures`, `/chat`, SQLite persistence
- LLM: DeepSeek (`deepseek-chat`, OpenAI-compatible API) with structured JSON output
- Dev env: server on `localhost:3000`; extension loaded unpacked in Chrome

## Contracts

- **AST:** `{ workflowName, description, steps: [{ stepNumber, action: CLICK|INPUT, selectors: string[], value?, description }] }` — `selectors` ordered by priority; `selectors[0]` is primary
- **Compile:** DeepSeek `json_object` mode, then validate against the AST schema in code with a repair-retry on mismatch
- **Replay:** locate via `querySelector(step.selectors)`; INPUT → set value via native setter (`Object.getOwnPropertyDescriptor`) + dispatch input/change (React/Vue controlled inputs); CLICK → scrollIntoView + click(); 500ms between steps
- **Replay errors:** selector unresolved → retry up to 3×, falling back sequentially down the priority chain; if still unresolvable, pause execution, highlight the failed step red in the side panel, and prompt the user for a manual click
- **Messages:** `START_RECORDING`, `GET_BUFFER`, `EXECUTE_AST` via background broker

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

- Selector priority (recorded per step): `data-testid` > `id` > `name` > `aria-label` > text content
- Record click/change on capture phase; truncate innerText to 50 chars
