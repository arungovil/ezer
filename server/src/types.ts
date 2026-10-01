export interface Env {
  port: number;
  dbPath: string;
  llmApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
}

export interface ApiErrorBody {
  error: string;
}

export interface HealthResponseBody {
  status: "ok";
}

export interface UserResponseBody {
  id: string;
  createdAt: string;
}

export const quickActionIds = ["notes", "reminders", "help"] as const;

export type QuickActionId = (typeof quickActionIds)[number];

export const taskKinds = ["reminder", "note"] as const;

export type TaskKind = (typeof taskKinds)[number];

export type TaskStatus = "active" | "done" | "dismissed";

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

export interface ChatTaskListItem {
  id: string;
  title: string;
  summary: string | null;
  dueAt: string | null;
}

export interface ChatTaskListContent {
  format: "taskList";
  kind: TaskKind;
  intro: string;
  items: ChatTaskListItem[];
}

export interface ChatMarkdownContent {
  format: "markdown";
  text: string;
}

export type ChatContent = ChatMarkdownContent | ChatTaskListContent;

export interface ChatRequestBody {
  message: string;
  tabUrl: string;
  action?: QuickActionId;
}

export interface ChatMessageBody {
  id: string;
  role: "user" | "ezer";
  messageType: string;
  content: string;
  createdAt: string;
}

export interface ChatListResponseBody {
  originId: string | null;
  origin: string | null;
  tabUrl: string;
  messages: ChatMessageBody[];
}

export interface ChatResponseBody {
  originId: string;
  origin: string;
  reply: string;
  rejected: boolean;
  userMessageId: string;
  ezerMessageId: string;
  content?: ChatContent;
}

export const chatIntents = ["specific", "summary", "out_of_scope"] as const;

export type ChatIntent = (typeof chatIntents)[number];

export interface Classification {
  intent: ChatIntent;
  standaloneQuery: string;
  topic: string;
  keywords: string[];
}

export interface AssistantState {
  intent: ChatIntent;
  topic: string;
  keywords: string[];
}

export interface AssistantReply {
  reply: string;
  rejected: boolean;
  state: AssistantState | null;
}

export interface UserRow {
  id: string;
  createdAt: string;
}

export interface OriginRow {
  id: string;
  userId: string;
  origin: string;
  createdAt: string;
}

export interface ChatRow {
  id: string;
  originId: string;
  role: "user" | "ezer";
  messageType: string;
  content: string;
  agentState: string | null;
  createdAt: string;
}

export interface InsertChatInput {
  id: string;
  originId: string;
  role: "user" | "ezer";
  messageType: string;
  content: string;
  agentState?: string | null;
}

export interface TaskRow {
  id: string;
  originId: string;
  userId: string;
  chatId: string | null;
  kind: TaskKind;
  title: string;
  summary: string | null;
  body: string | null;
  dueAt: string | null;
  status: TaskStatus;
  sourceUrl: string | null;
  sourceTitle: string | null;
  createdAt: string;
}

export interface InsertTaskInput {
  originId: string;
  userId: string;
  chatId?: string;
  kind: TaskKind;
  title: string;
  summary: string | null;
  body?: string | null;
  dueAt: string | null;
  sourceUrl?: string;
  sourceTitle?: string;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  kind?: TaskKind;
  title?: string;
  summary?: string | null;
  dueAt?: string | null;
}
