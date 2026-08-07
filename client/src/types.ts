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
  type: "CLICK" | "INPUT";
  selectors: string[];
  value?: string;
  innerText?: string;
  tagName: string;
}
