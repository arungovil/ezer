-- chats
-- name: insert-chat
INSERT INTO chat (id, origin_id, role, message_type, content, agent_state, created_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7);

-- name: get-chat-for-user
-- A chat the user owns, through its origin. Foreign and missing chats look the same.
SELECT c.id, c.origin_id, c.role, c.message_type, c.content, c.agent_state, c.created_at
FROM chat c JOIN origin o ON o.id = c.origin_id
WHERE c.id = ?1 AND o.user_id = ?2 AND c.deleted_at IS NULL AND o.deleted_at IS NULL;

-- name: query-chats
-- One page of a thread, newest first. ?2 is an optional cursor message ID ('' = start at the
-- newest): only rows strictly older than it are returned. The cursor is compared as
-- (created_at, rowid) because created_at only has millisecond resolution and a user/ezer pair is
-- inserted within the same one. A cursor that isn't in this origin matches nothing, so it can't be
-- used to probe other threads. The caller passes limit+1 to learn whether another page exists.
SELECT id, origin_id, role, message_type, content, agent_state, created_at
FROM chat
WHERE origin_id = ?1 AND deleted_at IS NULL
    AND (?2 = '' OR (created_at, rowid) < (
        SELECT created_at, rowid FROM chat WHERE id = ?2 AND origin_id = ?1))
ORDER BY created_at DESC, rowid DESC
LIMIT ?3;

-- name: query-recent-text-chats
-- Newest first; the caller reverses for prompt order.
SELECT id, origin_id, role, message_type, content, agent_state, created_at
FROM chat WHERE origin_id = ?1 AND message_type = 'TEXT' AND deleted_at IS NULL
ORDER BY created_at DESC, rowid DESC
LIMIT ?2;

-- name: delete-chat
UPDATE chat SET deleted_at = ?1 WHERE id = ?2 AND deleted_at IS NULL;
