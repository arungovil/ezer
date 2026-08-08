export interface Message {
  id: string;
  role: "user" | "ezer";
  content: string;
  loading?: boolean;
}

export interface InfoPill {
  id: string;
  label: string;
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
