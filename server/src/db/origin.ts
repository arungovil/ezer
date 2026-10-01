import { randomUUID } from "node:crypto";
import type { OriginRow } from "../types.ts";
import { getDb } from "./index.ts";
import { notDeleted } from "./soft-delete.ts";

export function getOrCreateOrigin(userId: string, origin: string): OriginRow {
  const db = getDb();
  const existing = db
    .prepare(
      `
      SELECT id, user_id AS userId, origin, created_at AS createdAt
      FROM origin
      WHERE user_id = ? AND origin = ?
    `,
    )
    .get(userId, origin) as OriginRow | undefined;

  if (existing) {
    db.prepare(`UPDATE origin SET deleted_at = NULL WHERE id = ?`).run(existing.id);
    return existing;
  }

  const row: OriginRow = {
    id: randomUUID(),
    userId,
    origin,
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `
    INSERT INTO origin (id, user_id, origin, created_at)
    VALUES (@id, @userId, @origin, @createdAt)
  `,
  ).run(row);

  return row;
}

export function getOriginByUserAndOrigin(userId: string, origin: string): OriginRow | undefined {
  return getDb()
    .prepare(
      `
      SELECT id, user_id AS userId, origin, created_at AS createdAt
      FROM origin
      WHERE user_id = ? AND origin = ? AND ${notDeleted}
    `,
    )
    .get(userId, origin) as OriginRow | undefined;
}

export function getOriginByIdForUser(originId: string, userId: string): OriginRow | undefined {
  return getDb()
    .prepare(
      `
      SELECT id, user_id AS userId, origin, created_at AS createdAt
      FROM origin
      WHERE id = ? AND user_id = ? AND ${notDeleted}
    `,
    )
    .get(originId, userId) as OriginRow | undefined;
}
