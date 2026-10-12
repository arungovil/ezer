-- tasks
-- name: insert-task
INSERT INTO task (
    id, origin_id, user_id, chat_id, kind, title, summary, body, due_at, status,
    source_url, source_title, created_at
) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'active', ?10, ?11, ?12);

-- name: get-task
SELECT t.id, t.origin_id, o.origin, t.user_id, t.chat_id, t.kind, t.title, t.summary, t.body,
    t.due_at, t.status, t.source_url, t.source_title, t.created_at
FROM task t JOIN origin o ON o.id = t.origin_id
WHERE t.id = ?1 AND t.user_id = ?2 AND t.deleted_at IS NULL AND o.deleted_at IS NULL;

-- name: query-tasks
-- ?3 is an optional status filter ('' = any).
SELECT t.id, t.origin_id, o.origin, t.user_id, t.chat_id, t.kind, t.title, t.summary, t.body,
    t.due_at, t.status, t.source_url, t.source_title, t.created_at
FROM task t JOIN origin o ON o.id = t.origin_id
WHERE t.origin_id = ?1 AND t.user_id = ?2 AND (?3 = '' OR t.status = ?3)
    AND t.deleted_at IS NULL AND o.deleted_at IS NULL
ORDER BY t.created_at DESC, t.rowid DESC;

-- name: search-tasks
-- BM25-ranked FTS5 match. ?1 is a pre-quoted MATCH expression built by core.
SELECT t.id, t.origin_id, o.origin, t.user_id, t.chat_id, t.kind, t.title, t.summary, t.body,
    t.due_at, t.status, t.source_url, t.source_title, t.created_at
FROM task_fts
JOIN task t ON t.rowid = task_fts.rowid
JOIN origin o ON o.id = t.origin_id
WHERE task_fts MATCH ?1 AND t.origin_id = ?2 AND t.user_id = ?3
    AND t.deleted_at IS NULL AND o.deleted_at IS NULL
ORDER BY bm25(task_fts)
LIMIT ?4;

-- name: update-task
-- A patch in one statement: NULL leaves kind/title/status alone, and ?6/?8 say whether
-- summary/due_at were sent (so an explicit null can clear them).
UPDATE task SET
    kind = COALESCE(?3, kind),
    title = COALESCE(?4, title),
    status = COALESCE(?5, status),
    summary = CASE WHEN ?6 THEN ?7 ELSE summary END,
    due_at = CASE WHEN ?8 THEN ?9 ELSE due_at END
WHERE id = ?1 AND user_id = ?2 AND deleted_at IS NULL;

-- name: task-exists-for-chat
SELECT EXISTS(SELECT 1 FROM task WHERE chat_id = ?1 AND deleted_at IS NULL);
