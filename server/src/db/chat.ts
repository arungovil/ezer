import { getDb } from "./index.ts";
import { notDeleted, softDeleteTimestamp } from "./soft-delete.ts";

export interface ChatRow {
  id: string;
  originId: string;
  role: "user" | "ezer";
  messageType: string;
  content: string;
  createdAt: string;
}

interface InsertChatInput {
  id: string;
  originId: string;
  role: "user" | "ezer";
  messageType: string;
  content: string;
}

export function insertChat(input: InsertChatInput): ChatRow {
  const createdAt = new Date().toISOString();

  getDb()
    .prepare(
      `
      INSERT INTO chat (id, origin_id, role, message_type, content, created_at)
      VALUES (@id, @originId, @role, @messageType, @content, @createdAt)
    `,
    )
    .run({ ...input, createdAt });

  return {
    id: input.id,
    originId: input.originId,
    role: input.role,
    messageType: input.messageType,
    content: input.content,
    createdAt,
  };
}

export function getChatById(chatId: string): ChatRow | undefined {
  return getDb()
    .prepare(
      `
      SELECT
        id,
        origin_id AS originId,
        role,
        message_type AS messageType,
        content,
        created_at AS createdAt
      FROM chat
      WHERE id = ? AND ${notDeleted}
    `,
    )
    .get(chatId) as ChatRow | undefined;
}

export function listChatsByOriginId(originId: string): ChatRow[] {
  return getDb()
    .prepare(
      `
      SELECT
        id,
        origin_id AS originId,
        role,
        message_type AS messageType,
        content,
        created_at AS createdAt
      FROM chat
      WHERE origin_id = ? AND ${notDeleted}
      ORDER BY created_at ASC
    `,
    )
    .all(originId) as ChatRow[];
}

export function softDeleteChatById(chatId: string): boolean {
  const result = getDb()
    .prepare(
      `
      UPDATE chat
      SET deleted_at = ?
      WHERE id = ? AND ${notDeleted}
    `,
    )
    .run(softDeleteTimestamp(), chatId);

  return result.changes > 0;
}
