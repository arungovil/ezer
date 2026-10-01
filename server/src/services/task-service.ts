import { getOrCreateOrigin, getOriginByIdForUser, getOriginByUserAndOrigin } from "../db/origin.ts";
import {
  getTaskByIdForUser,
  insertTask,
  listTasksByOriginId,
  updateTaskForUser,
} from "../db/task.ts";
import { parsePageOrigin } from "../lib/parse-origin.ts";
import { toTaskResponseBody } from "../parsers.ts";
import type {
  CreateTaskRequestBody,
  TaskListResponseBody,
  TaskResponseBody,
  TaskStatus,
  UpdateTaskRequestBody,
} from "../types.ts";

function toResponse(task: {
  id: string;
  originId: string;
  origin: string;
  chatId: string | null;
  kind: CreateTaskRequestBody["kind"];
  title: string;
  summary: string | null;
  dueAt: string | null;
  status: TaskStatus;
  sourceUrl: string | null;
  sourceTitle: string | null;
  createdAt: string;
}): TaskResponseBody {
  return toTaskResponseBody(task);
}

export function createTask(userId: string, input: CreateTaskRequestBody): TaskResponseBody {
  const pageOrigin = parsePageOrigin(input.tabUrl);
  if (!pageOrigin) {
    throw new Error("Invalid tab URL");
  }

  const origin = getOrCreateOrigin(userId, pageOrigin);
  const task = insertTask({
    originId: origin.id,
    userId,
    kind: input.kind,
    title: input.title,
    summary: input.summary ?? null,
    dueAt: input.dueAt ?? null,
    ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
    ...(input.sourceTitle ? { sourceTitle: input.sourceTitle } : {}),
  });

  return toResponse({
    ...task,
    origin: origin.origin,
  });
}

export function getTask(userId: string, taskId: string): TaskResponseBody | undefined {
  const task = getTaskByIdForUser(taskId, userId);
  if (!task) {
    return undefined;
  }

  const originRow = getOriginByIdForUser(task.originId, userId);
  if (!originRow) {
    return undefined;
  }

  return toResponse({
    ...task,
    origin: originRow.origin,
  });
}

export function listTasksForTabUrl(
  userId: string,
  tabUrl: string,
  status?: TaskStatus,
): TaskListResponseBody {
  const pageOrigin = parsePageOrigin(tabUrl);
  if (!pageOrigin) {
    throw new Error("Invalid tab URL");
  }

  const origin = getOriginByUserAndOrigin(userId, pageOrigin);
  const tasks = origin ? listTasksByOriginId(origin.id, userId, status) : [];

  return {
    originId: origin?.id ?? null,
    origin: origin?.origin ?? null,
    tabUrl,
    tasks: tasks.map((task) =>
      toResponse({
        ...task,
        origin: origin?.origin ?? pageOrigin,
      }),
    ),
  };
}

export function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskRequestBody,
): TaskResponseBody | undefined {
  const task = updateTaskForUser(taskId, userId, input);
  if (!task) {
    return undefined;
  }

  const originRow = getOriginByIdForUser(task.originId, userId);
  if (!originRow) {
    return undefined;
  }

  return toResponse({
    ...task,
    origin: originRow.origin,
  });
}
