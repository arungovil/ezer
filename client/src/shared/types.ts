import type { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.js";

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
        | typeof MESSAGE_TYPE.QUICK_ACTION
        | typeof MESSAGE_TYPE.STATUS
        | typeof MESSAGE_TYPE.TAB_SWITCHED;
      content: string;
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
