import type { ACTION_TYPE, RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.js";
import type { ReplayFailure } from "@src/shared/replay-failure.js";

export type ActionType = (typeof ACTION_TYPE)[keyof typeof ACTION_TYPE];
export type RuntimeMessageType = (typeof RUNTIME_MESSAGE_TYPE)[keyof typeof RUNTIME_MESSAGE_TYPE];

export const MESSAGE_TYPE = {
  TEXT: "TEXT",
  CAPTURE: "CAPTURE",
  QUICK_ACTION: "QUICK_ACTION",
  RECORDING: "RECORDING",
  WORKFLOW: "WORKFLOW",
  WORKFLOW_LIST: "WORKFLOW_LIST",
  TAB_SWITCHED: "TAB_SWITCHED",
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export interface WorkflowContent {
  text: string;
  actions: RecordedAction[];
  replaying: boolean;
  saved: boolean;
  awaitingName?: boolean;
}

export interface WorkflowListContent {
  workflows: Workflow[];
}

export interface CaptureContent {
  text: string;
  url?: string;
  title?: string;
}

export type Message =
  | {
      id: string;
      role: "user" | "ezer";
      type:
        | typeof MESSAGE_TYPE.TEXT
        | typeof MESSAGE_TYPE.QUICK_ACTION
        | typeof MESSAGE_TYPE.RECORDING
        | typeof MESSAGE_TYPE.TAB_SWITCHED;
      content: string;
      loading?: boolean;
    }
  | {
      id: string;
      role: "user" | "ezer";
      type: typeof MESSAGE_TYPE.WORKFLOW;
      content: WorkflowContent;
      loading?: boolean;
    }
  | {
      id: string;
      role: "user" | "ezer";
      type: typeof MESSAGE_TYPE.WORKFLOW_LIST;
      content: WorkflowListContent;
      loading?: boolean;
    }
  | {
      id: string;
      role: "user";
      type: typeof MESSAGE_TYPE.CAPTURE;
      content: CaptureContent;
      loading?: boolean;
    };

export interface InfoPill {
  id: string;
  label: string;
  prompt: string;
  icon: unknown;
}

export interface RecordedAction {
  type: ActionType;
  selectors: string[];
  value?: string;
  checked?: boolean;
  innerText?: string;
  tagName: string;
}

export type CaptureHandler = (target: HTMLElement) => RecordedAction | null;

export type WorkflowStatus = "idle" | "recording" | "compiling" | "replaying" | "paused";

export interface Workflow {
  id: string;
  tabId: number;
  url: string;
  name: string;
  description?: string;
  actions: RecordedAction[];
  createdAt: number;
}

export interface RuntimeMessage {
  type: RuntimeMessageType;
  actions?: RecordedAction[];
  tabId?: number;
  text?: string;
  url?: string;
  title?: string;
  error?: string;
  failure?: ReplayFailure;
}

export interface PendingWorkflowSave {
  messageId: string;
  actions: RecordedAction[];
}

export interface ChatWindowHost {
  messages: Message[];
  savedWorkflows: Workflow[];
  workflowStatus: WorkflowStatus;
  replayingMessageId: string | null;
  pendingEmptyMsgId: string | null;
  pendingReplayError: string | null;
  pendingWorkflowSave: PendingWorkflowSave | null;
}
