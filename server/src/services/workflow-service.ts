import { getOrCreateOrigin, getOriginByIdForUser, getOriginByUserAndOrigin } from "../db/origin.js";
import { getWorkflowByIdForUser, insertWorkflow, listWorkflowsByOriginId } from "../db/workflow.js";
import { parsePageOrigin } from "../lib/parse-origin.js";
import type {
  CreateWorkflowRequestBody,
  WorkflowListResponseBody,
  WorkflowResponseBody,
} from "../types/workflow.js";
import { toWorkflowResponseBody } from "../types/workflow.js";

function toResponse(workflow: {
  id: string;
  originId: string;
  origin: string;
  name: string;
  actions: string;
  createdAt: string;
}): WorkflowResponseBody {
  return toWorkflowResponseBody(workflow);
}

export function createWorkflow(
  userId: string,
  input: CreateWorkflowRequestBody,
): WorkflowResponseBody {
  const pageOrigin = parsePageOrigin(input.tabUrl);
  if (!pageOrigin) {
    throw new Error("Invalid tab URL");
  }

  const origin = getOrCreateOrigin(userId, pageOrigin);
  const workflow = insertWorkflow({
    originId: origin.id,
    userId,
    name: input.name,
    actions: JSON.stringify(input.actions),
  });

  return toResponse({
    ...workflow,
    origin: origin.origin,
  });
}

export function getWorkflow(userId: string, workflowId: string): WorkflowResponseBody | undefined {
  const workflow = getWorkflowByIdForUser(workflowId, userId);
  if (!workflow) {
    return undefined;
  }

  const originRow = getOriginByIdForUser(workflow.originId, userId);
  if (!originRow) {
    return undefined;
  }

  return toResponse({
    ...workflow,
    origin: originRow.origin,
  });
}

export function listWorkflowsForTabUrl(userId: string, tabUrl: string): WorkflowListResponseBody {
  const pageOrigin = parsePageOrigin(tabUrl);
  if (!pageOrigin) {
    throw new Error("Invalid tab URL");
  }

  const origin = getOriginByUserAndOrigin(userId, pageOrigin);
  const workflows = origin ? listWorkflowsByOriginId(origin.id, userId) : [];

  return {
    originId: origin?.id ?? null,
    origin: origin?.origin ?? null,
    tabUrl,
    workflows: workflows.map((workflow) =>
      toResponse({
        ...workflow,
        origin: origin?.origin ?? pageOrigin,
      }),
    ),
  };
}
