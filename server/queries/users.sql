-- users
-- name: get-user
SELECT id, created_at FROM user WHERE id = ?1 AND deleted_at IS NULL;

-- name: upsert-user
-- Creates the user or revives a soft-deleted one.
INSERT INTO user (id) VALUES (?1)
ON CONFLICT(id) DO UPDATE SET deleted_at = NULL
RETURNING id, created_at;

-- name: delete-user-origins
UPDATE origin SET deleted_at = ?1 WHERE user_id = ?2 AND deleted_at IS NULL;

-- name: delete-user-chats
UPDATE chat SET deleted_at = ?1
WHERE origin_id IN (SELECT id FROM origin WHERE user_id = ?2) AND deleted_at IS NULL;

-- name: delete-user-tasks
UPDATE task SET deleted_at = ?1 WHERE user_id = ?2 AND deleted_at IS NULL;

-- name: delete-user
UPDATE user SET deleted_at = ?1 WHERE id = ?2 AND deleted_at IS NULL;
