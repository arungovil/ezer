import { randomUUID } from "node:crypto";
import { getDb } from "./index.js";

export interface ConversationRow {
  id: string;
  userId: string;
  tabUrl: string;
  createdAt: string;
}

export function getOrCreateConversation(userId: string, tabUrl: string): ConversationRow {
  const db = getDb();
  const existing = db
    .prepare(
      `
      SELECT id, user_id AS userId, tab_url AS tabUrl, created_at AS createdAt
      FROM conversations
      WHERE user_id = ? AND tab_url = ?
    `,
    )
    .get(userId, tabUrl) as ConversationRow | undefined;

  if (existing) {
    return existing;
  }

  const conversation: ConversationRow = {
    id: randomUUID(),
    userId,
    tabUrl,
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `
    INSERT INTO conversations (id, user_id, tab_url, created_at)
    VALUES (@id, @userId, @tabUrl, @createdAt)
  `,
  ).run(conversation);

  return conversation;
}
