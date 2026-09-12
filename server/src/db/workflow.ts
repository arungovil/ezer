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
