# Chat services

`POST /chat` without `action`: classify → retrieve notes (SQL/FTS5) → answer from notes only. With
`action`: `quickaction.go`, no LLM (`QUICK_ACTION` messages).

HTTP contract: [api.md](api.md#post-chat).

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
| `internal/core/chats.go` | Branch action vs assistant; persist; response |
| `internal/core/assistant.go` | Classify, retrieve, answer, canned replies, `agent_state` |
| `internal/core/quickactions.go` | Menu replies |
| `internal/core/prompts.go` | Classifier, answer and capture prompts |
| `internal/core/captures.go` | Capture extraction with note fallback |
| `queries/tasks.sql` | `search-tasks`, `query-tasks` |
| `queries/chats.sql` | `query-recent-text-chats` |

## Classify

Returns `intent` (`specific` \| `summary` \| `out_of_scope`), `standaloneQuery`, `topic`, `keywords`
(3–8 terms for FTS). Bad JSON/shape → `out_of_scope` (not `500`). LLM/network errors → `502`.
`parseClassification` in `internal/core/assistant.go` accepts `standaloneQuery` or `standalone_query`.

## Retrieve

Scoped in SQL by `origin_id` and `user_id`. Keywords → `search-tasks` (bm25, limit 40). No
keywords → `query-tasks`. Empty topic search retries once on `topic` only. Indexed `body` is
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

FTS details: [database.md](database.md#task_fts).
