import type { Request, Response } from "express";
import { errorMessages } from "../config/constants.js";
import { readUserId } from "../middleware/read-user-id.js";
import {
  createWorkflow,
  getWorkflow,
  listWorkflowsForTabUrl,
} from "../services/workflow-service.js";
import type { ApiErrorBody } from "../types/api.js";
import {
  parseCreateWorkflowRequest,
  parseWorkflowTabUrlQuery,
  type WorkflowListResponseBody,
  type WorkflowResponseBody,
} from "../types/workflow.js";

export function handleListWorkflows(
  req: Request,
  res: Response<WorkflowListResponseBody | ApiErrorBody>,
): void {
  const tabUrl = parseWorkflowTabUrlQuery(req.query.tabUrl);

  if (!tabUrl) {
    res.status(400).json({ error: errorMessages.tabUrlRequired });
    return;
  }

  try {
    const result = listWorkflowsForTabUrl(readUserId(res), tabUrl);
    res.json(result);
  } catch {
    res.status(400).json({ error: errorMessages.invalidTabUrl });
  }
}

export function handleGetWorkflow(
  req: Request,
  res: Response<WorkflowResponseBody | ApiErrorBody>,
): void {
  const workflowId = typeof req.params.id === "string" ? req.params.id.trim() : "";

  if (!workflowId) {
    res.status(400).json({ error: errorMessages.workflowIdRequired });
    return;
  }

  const workflow = getWorkflow(readUserId(res), workflowId);

  if (!workflow) {
    res.status(404).json({ error: errorMessages.workflowNotFound });
    return;
  }

  res.json(workflow);
}

export function handlePostWorkflow(
  req: Request,
  res: Response<WorkflowResponseBody | ApiErrorBody>,
): void {
  const input = parseCreateWorkflowRequest(req.body);

  if (!input) {
    res.status(400).json({ error: errorMessages.workflowRequired });
    return;
  }

  try {
    const workflow = createWorkflow(readUserId(res), input);
    res.status(201).json(workflow);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid tab URL") {
      res.status(400).json({ error: errorMessages.invalidTabUrl });
      return;
    }

    res.status(500).json({ error: errorMessages.workflowPersistFailed });
  }
}
