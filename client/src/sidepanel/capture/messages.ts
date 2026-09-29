import type { CaptureContent, Message } from "@src/shared/types.js";
import { MESSAGE_TYPE } from "@src/shared/types.js";

function newId(): string {
  return crypto.randomUUID();
}

export function ezerStatusMessage(content: string): Message {
  return {
    id: newId(),
    role: "ezer",
    type: MESSAGE_TYPE.STATUS,
    content,
  };
}

export function userTextMessage(content: string): Message {
  return {
    id: newId(),
    role: "user",
    type: MESSAGE_TYPE.TEXT,
    content,
  };
}

export function captureStartedMessage(): Message {
  return {
    id: newId(),
    role: "ezer",
    type: MESSAGE_TYPE.STATUS,
    content:
      "📌 **Highlight capture ready.** Select text on the page — I'll save it as a note, " +
      "or a reminder if it's something to do.",
  };
}

export function userCaptureMessage(content: CaptureContent): Message {
  return {
    id: newId(),
    role: "user",
    type: MESSAGE_TYPE.CAPTURE,
    content,
  };
}
