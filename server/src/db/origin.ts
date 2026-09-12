import { randomUUID } from "node:crypto";
import { getDb } from "./index.js";

export interface OriginRow {
  id: string;
  userId: string;
  origin: string;
  createdAt: string;
}

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
      WHERE user_id = ? AND origin = ?
    `,
    )
    .get(userId, origin) as OriginRow | undefined;
}
