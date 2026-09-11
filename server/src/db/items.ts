import { randomUUID } from "node:crypto";
import type { ItemKind } from "../types/capture.js";
import { getDb } from "./index.js";

export interface ItemRow {
  id: string;
  captureId: string;
  userId: string;
  kind: ItemKind;
  title: string;
  dueAt: string | null;
  status: "active" | "done" | "dismissed";
  summary: string | null;
  createdAt: string;
}

interface InsertItemInput {
  captureId: string;
  userId: string;
  kind: ItemKind;
  title: string;
  dueAt: string | null;
  summary: string | null;
}

export function insertItem(input: InsertItemInput): ItemRow {
  const item: ItemRow = {
    id: randomUUID(),
    captureId: input.captureId,
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    dueAt: input.dueAt,
    status: "active",
    summary: input.summary,
    createdAt: new Date().toISOString(),
  };

  getDb()
    .prepare(
      `
      INSERT INTO items (
        id,
        capture_id,
        user_id,
        kind,
        title,
        due_at,
        status,
        summary,
        created_at
      )
      VALUES (
        @id,
        @captureId,
        @userId,
        @kind,
        @title,
        @dueAt,
        @status,
        @summary,
        @createdAt
      )
    `,
    )
    .run(item);

  return item;
}
