import { parseTabUrlQuery } from "./capture.js";

export const actionTypes = ["CLICK", "INPUT", "SUBMIT"] as const;

export type ActionType = (typeof actionTypes)[number];

export interface RecordedActionBody {
  type: ActionType;
  selectors: string[];
  value?: string;
  checked?: boolean;
  innerText?: string;
  tagName: string;
}

export interface CreateWorkflowRequestBody {
  name: string;
  tabUrl: string;
  actions: RecordedActionBody[];
}

export interface WorkflowResponseBody {
  id: string;
  originId: string;
  origin: string;
  name: string;
  actions: RecordedActionBody[];
  createdAt: string;
}

export interface WorkflowListResponseBody {
  originId: string | null;
  origin: string | null;
  tabUrl: string;
  workflows: WorkflowResponseBody[];
}

function isActionType(value: unknown): value is ActionType {
  return typeof value === "string" && (actionTypes as readonly string[]).includes(value);
}

function isRecordedAction(value: unknown): value is RecordedActionBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const action = value as RecordedActionBody;
  return (
    isActionType(action.type) &&
    Array.isArray(action.selectors) &&
    action.selectors.every((selector) => typeof selector === "string") &&
    typeof action.tagName === "string" &&
    action.tagName.length > 0 &&
    (action.value === undefined || typeof action.value === "string") &&
    (action.checked === undefined || typeof action.checked === "boolean") &&
    (action.innerText === undefined || typeof action.innerText === "string")
  );
}

export function parseCreateWorkflowRequest(body: unknown): CreateWorkflowRequestBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as CreateWorkflowRequestBody;
  if (typeof record.name !== "string" || typeof record.tabUrl !== "string") {
    return null;
  }

  const name = record.name.trim();
  const tabUrl = record.tabUrl.trim();
  if (!name || !tabUrl || !Array.isArray(record.actions)) {
    return null;
  }

  if (!record.actions.every(isRecordedAction)) {
    return null;
  }

  return { name, tabUrl, actions: record.actions };
}

export function parseWorkflowTabUrlQuery(value: unknown): string | null {
  return parseTabUrlQuery(value);
}

export function parseRecordedActionsJson(raw: string): RecordedActionBody[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isRecordedAction)) {
    throw new Error("Invalid workflow actions");
  }

  return parsed;
}

export function toWorkflowResponseBody(workflow: {
  id: string;
  originId: string;
  origin: string;
  name: string;
  actions: string;
  createdAt: string;
}): WorkflowResponseBody {
  return {
    id: workflow.id,
    originId: workflow.originId,
    origin: workflow.origin,
    name: workflow.name,
    actions: parseRecordedActionsJson(workflow.actions),
    createdAt: workflow.createdAt,
  };
}
