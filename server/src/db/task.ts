import { randomUUID } from "node:crypto";
import type { TaskKind } from "../types/capture.ts";
import type { TaskStatus } from "../types/task.ts";
import { getDb } from "./index.ts";
import { notDeleted, softDeleteTimestamp } from "./soft-delete.ts";

export interface TaskRow {
  id: string;
  originId: string;
  userId: string;
  chatId: string | null;
  kind: TaskKind;
  title: string;
  summary: string | null;
  body: string | null;
  dueAt: string | null;
  status: TaskStatus;
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
  body?: string | null;
  dueAt: string | null;
  sourceUrl?: string;
  sourceTitle?: string;
}

interface UpdateTaskInput {
  status?: TaskStatus;
  kind?: TaskKind;
  title?: string;
  summary?: string | null;
  dueAt?: string | null;
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
    body: input.body ?? null,
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
        body,
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
        @body,
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

export function getTaskByIdForUser(taskId: string, userId: string): TaskRow | undefined {
  return getDb()
    .prepare(
      `
      SELECT
        id,
        origin_id AS originId,
        user_id AS userId,
        chat_id AS chatId,
        kind,
        title,
        summary,
        body,
        due_at AS dueAt,
        status,
        source_url AS sourceUrl,
        source_title AS sourceTitle,
        created_at AS createdAt
      FROM task
      WHERE id = ? AND user_id = ? AND ${notDeleted}
    `,
    )
    .get(taskId, userId) as TaskRow | undefined;
}

export function listTasksByOriginId(
  originId: string,
  userId: string,
  status?: TaskStatus,
): TaskRow[] {
  const sql = status
    ? `
      SELECT
        id,
        origin_id AS originId,
        user_id AS userId,
        chat_id AS chatId,
        kind,
        title,
        summary,
        body,
        due_at AS dueAt,
        status,
        source_url AS sourceUrl,
        source_title AS sourceTitle,
        created_at AS createdAt
      FROM task
      WHERE origin_id = ? AND user_id = ? AND status = ? AND ${notDeleted}
      ORDER BY created_at DESC
    `
    : `
      SELECT
        id,
        origin_id AS originId,
        user_id AS userId,
        chat_id AS chatId,
        kind,
        title,
        summary,
        body,
        due_at AS dueAt,
        status,
        source_url AS sourceUrl,
        source_title AS sourceTitle,
        created_at AS createdAt
      FROM task
      WHERE origin_id = ? AND user_id = ? AND ${notDeleted}
      ORDER BY created_at DESC
    `;

  const statement = getDb().prepare(sql);
  return (
    status ? statement.all(originId, userId, status) : statement.all(originId, userId)
  ) as TaskRow[];
}

export function updateTaskForUser(
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
): TaskRow | undefined {
  const existing = getTaskByIdForUser(taskId, userId);
  if (!existing) {
    return undefined;
  }

  const updated: TaskRow = {
    ...existing,
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.kind !== undefined ? { kind: input.kind } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
  };

  getDb()
    .prepare(
      `
      UPDATE task
      SET
        kind = @kind,
        title = @title,
        summary = @summary,
        due_at = @dueAt,
        status = @status
      WHERE id = @id AND user_id = @userId AND ${notDeleted}
    `,
    )
    .run(updated);

  return updated;
}

export function softDeleteTaskForUser(taskId: string, userId: string): boolean {
  const result = getDb()
    .prepare(
      `
      UPDATE task
      SET deleted_at = ?
      WHERE id = ? AND user_id = ? AND ${notDeleted}
    `,
    )
    .run(softDeleteTimestamp(), taskId, userId);

  return result.changes > 0;
}

export function taskExistsForChatId(chatId: string): boolean {
  const row = getDb()
    .prepare(`SELECT id FROM task WHERE chat_id = ? AND ${notDeleted}`)
    .get(chatId);

  return row !== undefined;
}

function buildMatchQuery(keywords: string[]): string | null {
  const terms = keywords
    .map((keyword) => keyword.replace(/["']/g, "").trim())
    .filter((keyword) => keyword.length > 0)
    .map((keyword) => `"${keyword}"`);

  return terms.length > 0 ? terms.join(" OR ") : null;
}

export function searchTasksByOrigin(
  originId: string,
  userId: string,
  keywords: string[],
  limit: number,
): TaskRow[] {
  const matchQuery = buildMatchQuery(keywords);
  if (!matchQuery) {
    return [];
  }

  return getDb()
    .prepare(
      `
      SELECT
        t.id,
        t.origin_id AS originId,
        t.user_id AS userId,
        t.chat_id AS chatId,
        t.kind,
        t.title,
        t.summary,
        t.body,
        t.due_at AS dueAt,
        t.status,
        t.source_url AS sourceUrl,
        t.source_title AS sourceTitle,
        t.created_at AS createdAt
      FROM task_fts
      JOIN task t ON t.rowid = task_fts.rowid
      WHERE task_fts MATCH @matchQuery
        AND t.origin_id = @originId
        AND t.user_id = @userId
        AND t.deleted_at IS NULL
      ORDER BY bm25(task_fts)
      LIMIT @limit
    `,
    )
    .all({ matchQuery, originId, userId, limit }) as TaskRow[];
}
