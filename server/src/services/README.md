# Chat services

`POST /chat` without `action`: classify → retrieve notes (SQL/FTS5) → answer from notes only. With
`action`: `quick-action-service.ts` + `config/quick-actions.ts`, no LLM (`QUICK_ACTION` messages).

HTTP contract: [../routes/README.md](../routes/README.md#post-chat).

The model routes and phrases; it does not supply facts outside retrieved rows.

## Pipeline

```
message (origin + user scoped)
  ├─ classify (LLM JSON) → out_of_scope → canned refusal, rejected: true
  ├─ retrieve (FTS5 or list) → no hits → canned empty / not found
  └─ answer (LLM on <notes> block) or deterministic list (specific, no topic)
```

Off-topic and empty retrieval skip extra LLM calls after classify or retrieve.

## Code map

| File | Role |
| ---- | ---- |
| `chat-service.ts` | Branch action vs assistant; persist; response |
| `assistant-service.ts` | Classify, retrieve, answer, canned replies, `agent_state` |
| `quick-action-service.ts` | Menu replies |
| `prompts/assistant.ts` | Classifier and answer prompts |
| `db/task.ts` | `searchTasksByOrigin` |
| `db/chat.ts` | `listRecentChatsByOriginId` |

## Classify

Returns `intent` (`specific` \| `summary` \| `out_of_scope`), `standaloneQuery`, `topic`, `keywords`
(3–8 terms for FTS). Bad JSON/shape → `out_of_scope` (not `500`). LLM/network errors → `502`.
`parseClassification` in `parsers.ts` accepts `standaloneQuery` or `standalone_query`.

## Retrieve

Scoped in SQL by `origin_id` and `user_id`. Keywords → `searchTasksByOrigin` (bm25, limit 40). No
keywords → `listTasksByOriginId`. Empty topic search retries once on `topic` only. Indexed `body` is
the full capture text.

## Answer

`specific` with no topic and hits → `formatAllNotes` (no LLM). Else LLM at temperature 0.3 with capped
notes block (8k chars). Prompt treats `<notes>` as data, not instructions.

## Follow-ups

Assistant rows store `agent_state` JSON `{ intent, topic, keywords }` (null on refusal). Classifier
history: last 6 `TEXT` messages, 500 chars each, with `[state: …]` on assistant turns.

## Canned outcomes

| Case | Behavior |
| ---- | -------- |
| `out_of_scope` | Refusal, `rejected: true` |
| Topic search, no hits | Named topic in message |
| All-notes, empty origin | Empty-state copy |
| `specific`, no topic, hits | Deterministic list |

FTS details: [../db/README.md](../db/README.md#task_fts).
