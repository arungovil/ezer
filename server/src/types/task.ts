import { parseTabUrlQuery, type TaskKind, taskKinds } from "./capture.js";

export type TaskStatus = "active" | "done" | "dismissed";

export interface CreateTaskRequestBody {
  kind: TaskKind;
  title: string;
  tabUrl: string;
  summary?: string;
  dueAt?: string | null;
  sourceUrl?: string;
  sourceTitle?: string;
}

export interface UpdateTaskRequestBody {
  status?: TaskStatus;
  title?: string;
  summary?: string | null;
  dueAt?: string | null;
  kind?: TaskKind;
}

export interface TaskResponseBody {
  id: string;
  originId: string;
  origin: string;
  chatId: string | null;
  kind: TaskKind;
  title: string;
  summary: string | null;
  dueAt: string | null;
  status: TaskStatus;
  sourceUrl: string | null;
  sourceTitle: string | null;
  createdAt: string;
}

export interface TaskListResponseBody {
  originId: string | null;
  origin: string | null;
  tabUrl: string;
  tasks: TaskResponseBody[];
}

const taskStatuses = ["active", "done", "dismissed"] as const;

function isTaskKind(value: unknown): value is TaskKind {
  return typeof value === "string" && (taskKinds as readonly string[]).includes(value);
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (taskStatuses as readonly string[]).includes(value);
}

export function parseCreateTaskRequest(body: unknown): CreateTaskRequestBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as CreateTaskRequestBody;
  if (
    typeof record.title !== "string" ||
    typeof record.tabUrl !== "string" ||
    !isTaskKind(record.kind)
  ) {
    return null;
  }

  const title = record.title.trim();
  const tabUrl = record.tabUrl.trim();
  if (!title || !tabUrl) {
    return null;
  }

  return {
    kind: record.kind,
    title,
    tabUrl,
    ...(typeof record.summary === "string" ? { summary: record.summary.trim() } : {}),
    ...(record.dueAt === null || typeof record.dueAt === "string" ? { dueAt: record.dueAt } : {}),
    ...(typeof record.sourceUrl === "string" && record.sourceUrl.trim()
      ? { sourceUrl: record.sourceUrl.trim() }
      : {}),
    ...(typeof record.sourceTitle === "string" && record.sourceTitle.trim()
      ? { sourceTitle: record.sourceTitle.trim() }
      : {}),
  };
}

export function parseUpdateTaskRequest(body: unknown): UpdateTaskRequestBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as UpdateTaskRequestBody;
  const update: UpdateTaskRequestBody = {};

  if (record.status !== undefined) {
    if (!isTaskStatus(record.status)) {
      return null;
    }
    update.status = record.status;
  }

  if (record.kind !== undefined) {
    if (!isTaskKind(record.kind)) {
      return null;
    }
    update.kind = record.kind;
  }

  if (record.title !== undefined) {
    if (typeof record.title !== "string") {
      return null;
    }
    const title = record.title.trim();
    if (!title) {
      return null;
    }
    update.title = title;
  }

  if (record.summary !== undefined) {
    if (record.summary !== null && typeof record.summary !== "string") {
      return null;
    }
    update.summary = record.summary === null ? null : record.summary.trim();
  }

  if (record.dueAt !== undefined) {
    if (record.dueAt !== null && typeof record.dueAt !== "string") {
      return null;
    }
    update.dueAt = record.dueAt;
  }

  return Object.keys(update).length > 0 ? update : null;
}

export function parseTaskTabUrlQuery(value: unknown): string | null {
  return parseTabUrlQuery(value);
}

export function parseTaskStatusQuery(value: unknown): TaskStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const status = value.trim();
  return isTaskStatus(status) ? status : null;
}

export function toTaskResponseBody(task: {
  id: string;
  originId: string;
  origin: string;
  chatId: string | null;
  kind: TaskKind;
  title: string;
  summary: string | null;
  dueAt: string | null;
  status: TaskStatus;
  sourceUrl: string | null;
  sourceTitle: string | null;
  createdAt: string;
}): TaskResponseBody {
  return {
    id: task.id,
    originId: task.originId,
    origin: task.origin,
    chatId: task.chatId,
    kind: task.kind,
    title: task.title,
    summary: task.summary,
    dueAt: task.dueAt,
    status: task.status,
    sourceUrl: task.sourceUrl,
    sourceTitle: task.sourceTitle,
    createdAt: task.createdAt,
  };
}
