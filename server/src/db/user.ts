import { getDb } from "./index.js";

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
      WHERE id = ?
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
      ON CONFLICT(id) DO NOTHING
    `,
    )
    .run(userId);

  const user = getUserById(userId);
  if (!user) {
    throw new Error("Failed to upsert user");
  }

  return user;
}

export function deleteUser(userId: string): boolean {
  const db = getDb();

  const deleteOwned = db.transaction(() => {
    const originIds = db.prepare(`SELECT id FROM origin WHERE user_id = ?`).all(userId) as Array<{
      id: string;
    }>;

    for (const { id: originId } of originIds) {
      db.prepare(`DELETE FROM chat WHERE origin_id = ?`).run(originId);
      db.prepare(`DELETE FROM task WHERE origin_id = ?`).run(originId);
      db.prepare(`DELETE FROM workflow WHERE origin_id = ?`).run(originId);
    }

    db.prepare(`DELETE FROM origin WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM task WHERE user_id = ?`).run(userId);
    db.prepare(`DELETE FROM workflow WHERE user_id = ?`).run(userId);

    const result = db.prepare(`DELETE FROM user WHERE id = ?`).run(userId);
    return result.changes > 0;
  });

  return deleteOwned();
}
