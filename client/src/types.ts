export const MESSAGE_TYPE = {
  TEXT: "TEXT",
  QUICK_ACTION: "QUICK_ACTION",
  RECORDING: "RECORDING",
  WORKFLOW: "WORKFLOW",
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export interface WorkflowContent {
  text: string;
  actions: RecordedAction[];
  replaying: boolean;
}

export type Message =
  | {
      id: string;
      role: "user" | "ezer";
      type:
        | typeof MESSAGE_TYPE.TEXT
        | typeof MESSAGE_TYPE.QUICK_ACTION
        | typeof MESSAGE_TYPE.RECORDING;
      content: string;
      loading?: boolean;
    }
  | {
      id: string;
      role: "user" | "ezer";
      type: typeof MESSAGE_TYPE.WORKFLOW;
      content: WorkflowContent;
      loading?: boolean;
    };

export interface InfoPill {
  id: string;
  label: string;
  prompt: string;
  icon: unknown;
}

export interface RecordedAction {
  type: "CLICK" | "INPUT" | "SUBMIT";
  selectors: string[];
  value?: string;
  checked?: boolean;
  innerText?: string;
  tagName: string;
}

export type CaptureHandler = (target: HTMLElement) => RecordedAction | null;

export type WorkflowStatus = "idle" | "recording" | "compiling" | "replaying" | "paused";

export interface RuntimeMessage {
  type: string;
  actions?: RecordedAction[];
}
