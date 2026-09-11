import { getDb } from "./index.js";

export interface MessageRow {
  id: string;
  conversationId: string;
  role: "user" | "ezer";
  messageType: string;
  content: string;
  createdAt: string;
}

interface InsertMessageInput {
  id: string;
  conversationId: string;
  role: "user" | "ezer";
  messageType: string;
  content: string;
}

export function insertMessage(input: InsertMessageInput): MessageRow {
  const createdAt = new Date().toISOString();

  getDb()
    .prepare(
      `
      INSERT INTO messages (id, conversation_id, role, message_type, content, created_at)
      VALUES (@id, @conversationId, @role, @messageType, @content, @createdAt)
    `,
    )
    .run({ ...input, createdAt });

  return {
    id: input.id,
    conversationId: input.conversationId,
    role: input.role,
    messageType: input.messageType,
    content: input.content,
    createdAt,
  };
}

export function listMessagesByTabUrl(userId: string, tabUrl: string): MessageRow[] {
  return getDb()
    .prepare(
      `
      SELECT
        m.id,
        m.conversation_id AS conversationId,
        m.role,
        m.message_type AS messageType,
        m.content,
        m.created_at AS createdAt
      FROM messages m
      INNER JOIN conversations c ON c.id = m.conversation_id
      WHERE c.user_id = ? AND c.tab_url = ?
      ORDER BY m.created_at ASC
    `,
    )
    .all(userId, tabUrl) as MessageRow[];
}
