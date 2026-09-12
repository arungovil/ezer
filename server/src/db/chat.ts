import { getDb } from "./index.js";

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
      WHERE origin_id = ?
      ORDER BY created_at ASC
    `,
    )
    .all(originId) as ChatRow[];
}
