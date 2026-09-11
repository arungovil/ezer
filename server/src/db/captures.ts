import { randomUUID } from "node:crypto";
import { getDb } from "./index.js";

export interface CaptureRow {
  id: string;
  conversationId: string;
  userId: string;
  rawText: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  createdAt: string;
}

interface InsertCaptureInput {
  conversationId: string;
  userId: string;
  rawText: string;
  sourceUrl?: string;
  sourceTitle?: string;
}

export function insertCapture(input: InsertCaptureInput): CaptureRow {
  const capture: CaptureRow = {
    id: randomUUID(),
    conversationId: input.conversationId,
    userId: input.userId,
    rawText: input.rawText,
    sourceUrl: input.sourceUrl ?? null,
    sourceTitle: input.sourceTitle ?? null,
    createdAt: new Date().toISOString(),
  };

  getDb()
    .prepare(
      `
      INSERT INTO captures (
        id,
        conversation_id,
        user_id,
        raw_text,
        source_url,
        source_title,
        created_at
      )
      VALUES (
        @id,
        @conversationId,
        @userId,
        @rawText,
        @sourceUrl,
        @sourceTitle,
        @createdAt
      )
    `,
    )
    .run(capture);

  return capture;
}
