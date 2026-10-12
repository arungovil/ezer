-- origins
-- name: upsert-origin
-- One atomic statement so two concurrent captures on a new site cannot race into a unique
-- constraint failure. Also revives a soft-deleted origin.
INSERT INTO origin (id, user_id, origin, created_at) VALUES (?1, ?2, ?3, ?4)
ON CONFLICT(user_id, origin) DO UPDATE SET deleted_at = NULL
RETURNING id, user_id, origin, created_at;

-- name: get-origin
SELECT id, user_id, origin, created_at FROM origin
WHERE user_id = ?1 AND origin = ?2 AND deleted_at IS NULL;
