import { getDb } from "./index.js";
import { notDeleted, softDeleteTimestamp } from "./soft-delete.js";

export interface UserRow {
  id: string;
  createdAt: string;
}

export function getUserById(userId: string): UserRow | undefined {
  return getDb()
    .prepare(
      `
      SELECT id, created_at AS createdAt
      FROM user
      WHERE id = ? AND ${notDeleted}
    `,
    )
    .get(userId) as UserRow | undefined;
}

export function upsertUser(userId: string): UserRow {
  getDb()
    .prepare(
      `
      INSERT INTO user (id)
      VALUES (?)
      ON CONFLICT(id) DO UPDATE SET deleted_at = NULL
    `,
    )
    .run(userId);

  const user = getUserById(userId);
  if (!user) {
    throw new Error("Failed to upsert user");
  }

  return user;
}

export function softDeleteUser(userId: string): boolean {
  const db = getDb();
  const deletedAt = softDeleteTimestamp();

  const softDeleteOwned = db.transaction(() => {
    const activeUser = db.prepare(`SELECT id FROM user WHERE id = ? AND ${notDeleted}`).get(userId);

    if (!activeUser) {
      return false;
    }

    db.prepare(`UPDATE origin SET deleted_at = ? WHERE user_id = ? AND ${notDeleted}`).run(
      deletedAt,
      userId,
    );

    db.prepare(
      `
      UPDATE chat
      SET deleted_at = ?
      WHERE origin_id IN (SELECT id FROM origin WHERE user_id = ?)
        AND ${notDeleted}
    `,
    ).run(deletedAt, userId);

    db.prepare(`UPDATE task SET deleted_at = ? WHERE user_id = ? AND ${notDeleted}`).run(
      deletedAt,
      userId,
    );

    db.prepare(`UPDATE workflow SET deleted_at = ? WHERE user_id = ? AND ${notDeleted}`).run(
      deletedAt,
      userId,
    );

    db.prepare(`UPDATE user SET deleted_at = ? WHERE id = ? AND ${notDeleted}`).run(
      deletedAt,
      userId,
    );

    return true;
  });

  return softDeleteOwned();
}
