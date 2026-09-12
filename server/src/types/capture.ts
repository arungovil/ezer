export const taskKinds = ["reminder", "note"] as const;

export type TaskKind = (typeof taskKinds)[number];

/** @deprecated Use TaskKind */
export type ItemKind = TaskKind;

/** @deprecated Use taskKinds */
export const itemKinds = taskKinds;

export interface CaptureRequestBody {
  text: string;
  tabUrl: string;
  url?: string;
  title?: string;
  timezone?: string;
}

export interface CaptureItemBody {
  id: string;
  kind: TaskKind;
  title: string;
  dueAt: string | null;
  summary: string | null;
}

export interface CaptureResponseBody {
  taskId: string;
  originId: string;
  origin: string;
  item: CaptureItemBody;
  reply: string;
  userMessageId: string;
  ezerMessageId: string;
}

export interface CaptureLlmResult {
  kind: TaskKind;
  title: string;
  dueAt: string | null;
  summary: string;
  reply: string;
}

export function parseCaptureRequest(body: unknown): CaptureRequestBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as CaptureRequestBody;
  if (typeof record.text !== "string" || typeof record.tabUrl !== "string") {
    return null;
  }

  const text = record.text.trim();
  const tabUrl = record.tabUrl.trim();
  if (!text || !tabUrl) {
    return null;
  }

  return {
    text,
    tabUrl,
    ...(typeof record.url === "string" && record.url.trim() ? { url: record.url.trim() } : {}),
    ...(typeof record.title === "string" && record.title.trim()
      ? { title: record.title.trim() }
      : {}),
    ...(typeof record.timezone === "string" && record.timezone.trim()
      ? { timezone: record.timezone.trim() }
      : {}),
  };
}

export function parseTabUrlQuery(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const tabUrl = value.trim();
  return tabUrl.length > 0 ? tabUrl : null;
}

function isTaskKind(value: unknown): value is TaskKind {
  return typeof value === "string" && (taskKinds as readonly string[]).includes(value);
}

export function isCaptureLlmResult(value: unknown): value is CaptureLlmResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const result = value as CaptureLlmResult;
  const dueAt = result.dueAt;

  return (
    isTaskKind(result.kind) &&
    typeof result.title === "string" &&
    result.title.trim().length > 0 &&
    (dueAt === null || typeof dueAt === "string") &&
    typeof result.summary === "string" &&
    typeof result.reply === "string" &&
    result.reply.trim().length > 0
  );
}
