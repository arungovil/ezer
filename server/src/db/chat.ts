import type { ChatRow, InsertChatInput } from "../types.ts";
import { getDb } from "./index.ts";
import { notDeleted, softDeleteTimestamp } from "./soft-delete.ts";

export function insertChat(input: InsertChatInput): ChatRow {
  const createdAt = new Date().toISOString();

  getDb()
    .prepare(
      `
      INSERT INTO chat (id, origin_id, role, message_type, content, agent_state, created_at)
      VALUES (@id, @originId, @role, @messageType, @content, @agentState, @createdAt)
    `,
    )
    .run({ ...input, agentState: input.agentState ?? null, createdAt });

  return {
    id: input.id,
    originId: input.originId,
    role: input.role,
    messageType: input.messageType,
    content: input.content,
    agentState: input.agentState ?? null,
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
        agent_state AS agentState,
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
        agent_state AS agentState,
        created_at AS createdAt
      FROM chat
      WHERE origin_id = ? AND ${notDeleted}
      ORDER BY created_at ASC
    `,
    )
    .all(originId) as ChatRow[];
}

export function listRecentChatsByOriginId(originId: string, limit: number): ChatRow[] {
  const rows = getDb()
    .prepare(
      `
      SELECT
        id,
        origin_id AS originId,
        role,
        message_type AS messageType,
        content,
        agent_state AS agentState,
        created_at AS createdAt
      FROM chat
      WHERE origin_id = ? AND message_type = 'TEXT' AND ${notDeleted}
      ORDER BY created_at DESC, rowid DESC
      LIMIT ?
    `,
    )
    .all(originId, limit) as ChatRow[];

  return rows.reverse();
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
