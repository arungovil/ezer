# Ezer assistant (chat)

How `POST /chat` works: **typed chat** (grounded assistant) and **menu actions** (deterministic
replies, no LLM).

### Menu actions (`action` on the request body)

When `action` is `notes`, `reminders`, or `help`, `chat-service.ts` calls `quick-action-service.ts`
(which reads tasks via `task-service.ts` or static copy in `config/quick-actions.ts`). Messages are
stored as `QUICK_ACTION`. This path does not run the pipeline below.

### Typed chat (no `action`)

Turns a message into an answer grounded **only** in the user's saved notes for the current page.

The assistant is not a general chatbot. It never answers from the model's own knowledge — the model
only **routes** and **phrases**, and the server does the retrieval. If the notes don't contain the
answer, the assistant says so.

## Pipeline

```
user message (scoped to the current tab's origin)
  │
  ├─ 1. classify   (LLM, JSON)   →  { intent, standaloneQuery, topic, keywords }
  │        intent ∈ specific | summary | out_of_scope
  │        out_of_scope ───────────────────────────► canned refusal (no more LLM)
  │
  ├─ 2. retrieve   (SQL / FTS5, scoped to origin + user)
  │        no hits  ────────────────────────────────► canned "nothing found"
  │
  └─ 3. answer     (LLM, notes only)  →  grounded reply
```

Steps 1 and 3 call the LLM. Step 2 is plain SQL. Off-topic messages and empty searches cost **zero**
extra LLM calls.

## Where things live

| File | Responsibility |
| ---- | -------------- |
| `assistant-service.ts` | The pipeline: `classify` → retrieve → `answer`, canned replies, `agent_state` |
| `chat-service.ts` | Orchestration: menu `action` branch or assistant path; persist messages; HTTP response |
| `quick-action-service.ts` | `notes` / `reminders` / `help` replies |
| `config/quick-actions.ts` | Help copy and list formatting for menu actions |
| `prompts/assistant.ts` | Classifier and answer system prompts |
| `db/task.ts` | `searchTasksByOrigin` — the FTS retrieval query |
| `db/chat.ts` | `listRecentChatsByOriginId` — follow-up history |

## 1. Classify

`classify(message, history)` sends the recent conversation plus the latest message and parses a JSON
classification:

| `intent` | Meaning |
| -------- | ------- |
| `specific` | A factual or existence question to answer from the notes ("what is a dam?", "do I have a note about X?") |
| `summary` | Summarise the notes — all of them or a specific topic ("summarise my notes") |
| `out_of_scope` | Not about recalling the user's notes (chit-chat, coding help, jokes) |

It also returns `standaloneQuery` (pronouns resolved so it reads without history), `topic`, and
`keywords` (3–8 words/short phrases including synonyms — this matters because retrieval is keyword
based, not semantic).

Failure handling:

- JSON parse or shape failure → treated as `out_of_scope` (canned refusal), never a `500`.
- LLM/network failure → propagates → `502` on the route.

`parseClassification` (`parsers.ts`) accepts both `standaloneQuery` and `standalone_query`.

## 2. Retrieve

Retrieval is the security boundary. It runs **fresh on every turn** and is scoped by `origin_id`
**and** `user_id` in SQL — never by prompt instructions.

- **With keywords** → `searchTasksByOrigin`: FTS5 over `task.title`, `summary`, `body`,
  `source_title` (porter-stemmed), ranked by `bm25`, limit 40.
- **Without keywords** (all-notes requests) → `listTasksByOriginId`.
- **Anchor fallback** → if a topic search returns nothing, retry once with just the anchor `topic`
  before giving up.

The note **body** (the full text the user selected at capture time) is indexed, so content questions
match on the note's actual words — not just its title.

## 3. Answer

`answer(intent, hits, history)` asks the LLM to answer **only** from a `<notes>` block built from the
retrieved rows.

- `specific` + no topic → **deterministic** list (`formatAllNotes`), no LLM call.
- Everything else with hits → LLM (temperature 0.3), prior turns included so the reply flows as a
  follow-up.
- The notes block is capped (8000 chars); omitted notes are labelled as such.

The answer prompt forbids outside knowledge, treats `<notes>` as data (not instructions — prompt
injection guard), and asks the reply to cite the note title.

## Follow-ups (`agent_state`)

Every assistant reply is stored with `chat.agent_state` — a JSON snapshot of `{ intent, topic,
keywords }`:

```json
{ "intent": "summary", "topic": "Gandhi", "keywords": ["Gandhi", "Mahatma", "Bapu"] }
```

On the next turn the classifier sees the recent history with `[state: …]` appended to assistant
turns, so pronoun follow-ups ("what about his childhood?") resolve to the right topic without relying
on prose inference. Refusals store `null`.

History is capped at the last 6 `TEXT` messages for the origin, each truncated to 500 chars.

## Canned replies

| Situation | Reply |
| --------- | ----- |
| `out_of_scope` | Refusal — "I can only answer from the notes you've saved on this page…" (`rejected: true`) |
| Topic search, no hits | "I couldn't find any notes about \"X\" on this page." |
| All-notes request, nothing saved | Empty-state message |
| `specific` + no topic, hits | Deterministic list of saved items |

See [../../README.md](../../README.md) for the HTTP contract and [../db/README.md](../db/README.md)
for the `task_fts` index.
