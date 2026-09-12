import { randomUUID } from "node:crypto";
import { getDb } from "./index.js";

export interface WorkflowRow {
  id: string;
  originId: string;
  userId: string;
  name: string;
  actions: string;
  createdAt: string;
}

interface InsertWorkflowInput {
  originId: string;
  userId: string;
  name: string;
  actions: string;
}

export function insertWorkflow(input: InsertWorkflowInput): WorkflowRow {
  const workflow: WorkflowRow = {
    id: randomUUID(),
    originId: input.originId,
    userId: input.userId,
    name: input.name,
    actions: input.actions,
    createdAt: new Date().toISOString(),
  };

  getDb()
    .prepare(
      `
      INSERT INTO workflow (id, origin_id, user_id, name, actions, created_at)
      VALUES (@id, @originId, @userId, @name, @actions, @createdAt)
    `,
    )
    .run(workflow);

  return workflow;
}

export function getWorkflowByIdForUser(
  workflowId: string,
  userId: string,
): WorkflowRow | undefined {
  return getDb()
    .prepare(
      `
      SELECT
        id,
        origin_id AS originId,
        user_id AS userId,
        name,
        actions,
        created_at AS createdAt
      FROM workflow
      WHERE id = ? AND user_id = ?
    `,
    )
    .get(workflowId, userId) as WorkflowRow | undefined;
}

export function listWorkflowsByOriginId(originId: string, userId: string): WorkflowRow[] {
  return getDb()
    .prepare(
      `
      SELECT
        id,
        origin_id AS originId,
        user_id AS userId,
        name,
        actions,
        created_at AS createdAt
      FROM workflow
      WHERE origin_id = ? AND user_id = ?
      ORDER BY created_at DESC
    `,
    )
    .all(originId, userId) as WorkflowRow[];
}
