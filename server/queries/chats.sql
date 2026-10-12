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
-- rowid breaks created_at ties: a user/ezer pair is inserted within the same millisecond.
SELECT id, origin_id, role, message_type, content, agent_state, created_at
FROM chat WHERE origin_id = ?1 AND deleted_at IS NULL
ORDER BY created_at ASC, rowid ASC;

-- name: query-recent-text-chats
-- Newest first; the caller reverses for prompt order.
SELECT id, origin_id, role, message_type, content, agent_state, created_at
FROM chat WHERE origin_id = ?1 AND message_type = 'TEXT' AND deleted_at IS NULL
ORDER BY created_at DESC, rowid DESC
LIMIT ?2;

-- name: delete-chat
UPDATE chat SET deleted_at = ?1 WHERE id = ?2 AND deleted_at IS NULL;
