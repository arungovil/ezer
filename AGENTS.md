# Ezer

Browser automation, done properly: record real interactions in a Chrome extension, compile them into a validated workflow AST with an LLM, and replay them via synthetic DOM events.

## Principles

- **Depth over breadth** — own one genuinely hard problem instead of skimming ten
- **Real world first** — malformed input, timeouts, concurrency: degrade gracefully, don't fall over
- **Deliberate calls** — every product, UX, and infra decision is reasoned, with the rationale recorded
- **Trustworthy by default** — observability, clear errors, one-shot setup, tests that catch real failures
- **The whole journey** — first-run, empty states, error moments, small touches

## Decisions

Running log (`decisions.md`) of design calls: what we chose, alternatives considered, tradeoffs accepted, what we cut and why. Concrete beats generic.

## Stack & Layout

- `client/` — Manifest V3, Lit, TS: `manifest.json`, `content.js` (recorder/replayer), `background.js` (broker), `sidepanel.html/.js`, `ui/agent-chat.js`
- `server/` — Express: `server.js` (`POST /api/compile`), `prompts.js` (prompts + AST schema)
- LLM: DeepSeek (`deepseek-chat`, OpenAI-compatible API) with structured JSON output
- Dev env: server on `localhost:3000`; extension loaded unpacked in Chrome

## Contracts

- **AST:** `{ workflowName, description, steps: [{ stepNumber, action: CLICK|INPUT, selectors: string[], value?, description }] }` — `selectors` ordered by priority; `selectors[0]` is primary
- **Compile:** DeepSeek `json_object` mode, then validate against the AST schema in code with a repair-retry on mismatch
- **Replay:** locate via `querySelector(step.selectors)`; INPUT → set value via native setter (`Object.getOwnPropertyDescriptor`) + dispatch input/change (React/Vue controlled inputs); CLICK → scrollIntoView + click(); 500ms between steps
- **Replay errors:** selector unresolved → retry up to 3×, falling back sequentially down the priority chain; if still unresolvable, pause execution, highlight the failed step red in the side panel, and prompt the user for a manual click
- **Messages:** `START_RECORDING`, `GET_BUFFER`, `EXECUTE_AST` via background broker

## Conventions

- Selector priority (recorded per step): `data-testid` > `id` > `name` > `aria-label` > text content
- Record click/change on capture phase; truncate innerText to 50 chars

## Open calls

- None — see `decisions.md` for resolved calls
