import type { CaptureContent, Message } from "@src/shared/types.js";
import { MESSAGE_TYPE } from "@src/shared/types.js";

function newId(): string {
  return crypto.randomUUID();
}

export function captureStartedMessage(): Message {
  return {
    id: newId(),
    role: "ezer",
    type: MESSAGE_TYPE.RECORDING,
    content:
      "📌 **Highlight capture ready.** Select text on the page — I'll save it as a reminder or note.",
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
