import { getDb } from "./index.js";

export function upsertUser(userId: string): void {
  getDb()
    .prepare(
      `
      INSERT INTO user (id)
      VALUES (?)
      ON CONFLICT(id) DO NOTHING
    `,
    )
    .run(userId);
}
