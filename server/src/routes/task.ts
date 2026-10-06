import type { Request, Response } from "express";

import { errorMessages } from "../config/constants.ts";
import { readUserId } from "../middleware/read-user-id.ts";
import {
  parseCreateTaskRequest,
  parseTaskStatusQuery,
  parseTaskTabUrlQuery,
  parseUpdateTaskRequest,
} from "../parsers.ts";
import { createTask, getTask, listTasksForTabUrl, updateTask } from "../services/task-service.ts";
import type { ApiErrorBody, TaskListResponseBody, TaskResponseBody } from "../types.ts";

export function handleListTasks(
  req: Request,
  res: Response<TaskListResponseBody | ApiErrorBody>,
): void {
  const tabUrl = parseTaskTabUrlQuery(req.query.tabUrl);

  if (!tabUrl) {
    res.status(400).json({ error: errorMessages.tabUrlRequired });
    return;
  }

  const status = parseTaskStatusQuery(req.query.status) ?? undefined;

  try {
    const result = listTasksForTabUrl(readUserId(res), tabUrl, status);
    res.json(result);
  } catch {
    res.status(400).json({ error: errorMessages.invalidTabUrl });
  }
}

export function handleGetTask(req: Request, res: Response<TaskResponseBody | ApiErrorBody>): void {
  const taskId = typeof req.params.id === "string" ? req.params.id.trim() : "";

  if (!taskId) {
    res.status(400).json({ error: errorMessages.taskIdRequired });
    return;
  }

  const task = getTask(readUserId(res), taskId);

  if (!task) {
    res.status(404).json({ error: errorMessages.taskNotFound });
    return;
  }

  res.json(task);
}

export function handlePostTask(req: Request, res: Response<TaskResponseBody | ApiErrorBody>): void {
  const input = parseCreateTaskRequest(req.body);

  if (!input) {
    res.status(400).json({ error: errorMessages.taskRequired });
    return;
  }

  try {
    const task = createTask(readUserId(res), input);
    res.status(201).json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid tab URL") {
      res.status(400).json({ error: errorMessages.invalidTabUrl });
      return;
    }

    res.status(500).json({ error: errorMessages.taskPersistFailed });
  }
}

export function handlePatchTask(
  req: Request,
  res: Response<TaskResponseBody | ApiErrorBody>,
): void {
  const taskId = typeof req.params.id === "string" ? req.params.id.trim() : "";

  if (!taskId) {
    res.status(400).json({ error: errorMessages.taskIdRequired });
    return;
  }

  const input = parseUpdateTaskRequest(req.body);

  if (!input) {
    res.status(400).json({ error: errorMessages.taskUpdateRequired });
    return;
  }

  const task = updateTask(readUserId(res), taskId, input);

  if (!task) {
    res.status(404).json({ error: errorMessages.taskNotFound });
    return;
  }

  res.json(task);
}
