import { randomUUID } from "node:crypto";
import type { TaskKind } from "../types/capture.js";
import { getDb } from "./index.js";

export interface TaskRow {
  id: string;
  originId: string;
  userId: string;
  chatId: string | null;
  kind: TaskKind;
  title: string;
  summary: string | null;
  dueAt: string | null;
  status: "active" | "done" | "dismissed";
  sourceUrl: string | null;
  sourceTitle: string | null;
  createdAt: string;
}

interface InsertTaskInput {
  originId: string;
  userId: string;
  chatId?: string;
  kind: TaskKind;
  title: string;
  summary: string | null;
  dueAt: string | null;
  sourceUrl?: string;
  sourceTitle?: string;
}

export function insertTask(input: InsertTaskInput): TaskRow {
  const task: TaskRow = {
    id: randomUUID(),
    originId: input.originId,
    userId: input.userId,
    chatId: input.chatId ?? null,
    kind: input.kind,
    title: input.title,
    dueAt: input.dueAt,
    status: "active",
    summary: input.summary,
    sourceUrl: input.sourceUrl ?? null,
    sourceTitle: input.sourceTitle ?? null,
    createdAt: new Date().toISOString(),
  };

  getDb()
    .prepare(
      `
      INSERT INTO task (
        id,
        origin_id,
        user_id,
        chat_id,
        kind,
        title,
        summary,
        due_at,
        status,
        source_url,
        source_title,
        created_at
      )
      VALUES (
        @id,
        @originId,
        @userId,
        @chatId,
        @kind,
        @title,
        @summary,
        @dueAt,
        @status,
        @sourceUrl,
        @sourceTitle,
        @createdAt
      )
    `,
    )
    .run(task);

  return task;
}

export function taskExistsForChatId(chatId: string): boolean {
  const row = getDb().prepare(`SELECT id FROM task WHERE chat_id = ?`).get(chatId);
  return row !== undefined;
}
