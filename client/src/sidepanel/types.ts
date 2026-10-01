import type { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.ts";
import type { TemplateResult } from "lit";

/** Structured assistant payload (`POST /chat` `content`, persisted on Ezer chat rows). */
export type ChatTaskKind = "note" | "reminder";

export interface ChatTaskListItem {
  id: string;
  title: string;
  summary: string | null;
  dueAt: string | null;
}

export interface ChatTaskListContent {
  format: "taskList";
  kind: ChatTaskKind;
  intro: string;
  items: ChatTaskListItem[];
}

export interface ChatMarkdownContent {
  format: "markdown";
  text: string;
}

export type ChatContent = ChatMarkdownContent | ChatTaskListContent;

export type QuickActionId = "notes" | "reminders" | "help";

export interface QuickAction {
  id: QuickActionId;
  label: string;
  keywords: string[];
  icon: TemplateResult;
}

export type ChatTaskArgs = readonly [text: string, ezerMsgId: string, action?: QuickActionId];

export interface ChatTaskResult {
  ezerMsgId: string;
  content: string | ChatContent;
}

export type CaptureTaskArgs = readonly [text: string, tabUrl: string, url?: string, title?: string];

export type RuntimeMessageType = (typeof RUNTIME_MESSAGE_TYPE)[keyof typeof RUNTIME_MESSAGE_TYPE];

export const MESSAGE_TYPE = {
  TEXT: "TEXT",
  CAPTURE: "CAPTURE",
  QUICK_ACTION: "QUICK_ACTION",
  STATUS: "STATUS",
  TAB_SWITCHED: "TAB_SWITCHED",
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

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
        | typeof MESSAGE_TYPE.STATUS
        | typeof MESSAGE_TYPE.TAB_SWITCHED;
      content: string;
      loading?: boolean;
    }
  | {
      id: string;
      role: "user";
      type: typeof MESSAGE_TYPE.QUICK_ACTION;
      content: string;
      loading?: boolean;
    }
  | {
      id: string;
      role: "ezer";
      type: typeof MESSAGE_TYPE.QUICK_ACTION;
      content: ChatContent;
      loading?: boolean;
    }
  | {
      id: string;
      role: "user";
      type: typeof MESSAGE_TYPE.CAPTURE;
      content: CaptureContent;
      loading?: boolean;
    };

export interface RuntimeMessage {
  type: RuntimeMessageType;
  tabId?: number;
  text?: string;
  url?: string;
  title?: string;
}

export interface ChatWindowHost {
  messages: Message[];
}
