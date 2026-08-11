# Decisions

Design and engineering log for Ezer. Each section includes decisions, alternatives, tradeoffs and current status as required.

---

## Product

### Watch → Compile → Replay

**Decision:** Ezer learns workflows by observing real browser interactions, compiles them into a structured AST, and replays them via synthetic DOM events. The primary UI is a **conversational side panel** — not a bare recorder or a script exporter.

---

### Chrome side panel as the shell

**Decision:** Ship as a Manifest V3 extension with a **side panel** opened from the toolbar action.

**Alternatives:**
- Popup — too cramped for workflow history and step detail.
- NPM library — will need to be integrated inside each apps.
- In-page overlay — fights host CSS, feels like an intrusion.

**Tradeoffs:** Not a standalone web app; extension install is required.

---

## Architecture

### Three-layer extension model

**Decision:** Split responsibilities across execution contexts with a background message broker. Follows MV3 architecture.

| Layer | Responsibility |
|-------|----------------|
| Content script | Capture DOM events, execute replay against the live page |
| Background worker | Recording buffer, tab lifecycle, message routing, script reinjection |
| Side panel | Chat UI, workflow library, user-initiated record/replay/save |

**Tradeoffs:** More message types and routing logic, but each layer stays testable and matches MV3 constraints.

---

### Synthetic DOM replay in the user's session

**Decision:** Locate elements with `querySelector`, act via `click()` or programmatic input with bubbled `input`/`change` events.

**Tradeoffs:** Replays run with the user's cookies, auth, and SPA state. Shadow DOM, iframes, and multi-page navigations are out of scope for the current release.

---

### Local compile service

**Decision:** Raw capture events are sent to a local Express service (`POST /api/compile`). DeepSeek (`deepseek-chat`, OpenAI-compatible API) produces JSON in `json_object` mode. Output is validated in code, retried once on schema failure, then replaced by a **deterministic fallback** (merge redundant steps, map raw events to AST) if the model still fails.

**Status:** The compile service is currently under development.

---

## Recording

### Priority-ordered CSS selector chains

**Decision:** Each action stores multiple selectors in priority order: `data-testid` → `id` → `name` → `aria-label` → `placeholder` → `type` → tag name. Replay walks the chain with retries.

---

### Background-owned recording buffer

**Decision:** `ACTION_CAPTURED` events accumulate in the background worker. On stop, the worker snapshots the buffer and emits `RECORDING_COMPLETE` to the side panel.

**Alternatives:**
- Buffer in the content script — lost on navigation or script reload.
- Buffer in the side panel — doesn't receive DOM events directly.

**Tradeoffs:** `isRecording` must stay aligned between background and content script; content script init syncs via `GET_RECORDING_STATE` after reload.

---

### Tab switch ends recording

**Decision:** Changing tabs clears recording state and surfaces a `TAB_SWITCHED` message in the panel (no duplicate stacking).

**Alternatives:**
- Continue across tabs — mixes actions from unrelated pages.

**Tradeoffs:** Workflows are page-scoped today; a new recording is required per tab context.

---

## Replay

### Native property setter for controlled inputs

**Decision:** Set `value` / `checked` through the prototype property descriptor (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set`), then dispatch `input` and `change` with `bubbles: true`.

**Alternatives:**
- Direct `element.value` assignment — ignored by React/Vue controlled inputs.

**Tradeoffs:** Covers the common framework case; custom input components may still not update.

---

### Pacing and selector retries

**Decision:** 800 ms between steps; up to 3 resolution attempts per step with 500 ms between retries; sequential fallback through the selector chain.

**Tradeoffs:** Slightly slower runs, better stability on async UIs.

---

### Failure UX — explain first, recover later

**Decision:** On failure, emit structured `ReplayFailure` to the side panel. Messages include step index, selector, action context, and a **positional hint** (first step → likely wrong page; later steps → prior step may have changed the DOM).

---

## Data & persistence

### Per-tab workflow storage (IndexedDB)

**Decision:** Workflows live in IndexedDB (`ezer` / `workflows`), indexed by `tabId`. List, save, and delete are scoped to the active tab.

**Tradeoffs:** Tab switches change which workflows appear. Cross-tab portability is not supported yet.

---

## UI & frontend

### Lit web components

**Decision:** Lit 3 for all extension UI — chat shell, message bubbles, shared primitives (`ez-button`, `ez-badge`, `ez-pill`).

**Alternatives:**
- React — larger bundle and build overhead for a side panel.

**Tradeoffs:** Small footprint and Shadow DOM styling.

---

### Design tokens on `:root`

**Decision:** Palette and semantic tokens (`--ez-color-primary`, `--ez-space-md`, etc.) in `styles.css`. Components reference `var(--token)` only in co-located `styles.ts`. Tokens cascade into Shadow DOM without per-component imports.

**Alternatives:**
- Utility CSS (Tailwind) in shadow roots — extra build complexity.

**Tradeoffs:** New semantics require extending the token file.

---

## Engineering

### Tooling

**Decision:** Biome (lint + format), Husky + lint-staged, esbuild for extension bundles, strict TypeScript (`tsc --noEmit`), named exports, kebab-case files.

**Alternatives:**
- ESLint + Prettier — dual config maintenance.
- Webpack for the extension — slower dev loop.

**Tradeoffs:** No test runner or CI pipeline yet (see backlog).

---
