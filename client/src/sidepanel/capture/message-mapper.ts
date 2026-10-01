import type { ChatMessageBody } from "@src/sidepanel/api/types.ts";
import { parseStoredChatContent } from "@src/sidepanel/chat-content.ts";
import type { CaptureContent, Message } from "@src/sidepanel/types.ts";
import { MESSAGE_TYPE } from "@src/sidepanel/types.ts";

function parseCaptureContent(raw: string): CaptureContent {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return { text: raw };
    }

    const record = parsed as CaptureContent;
    if (typeof record.text !== "string") {
      return { text: raw };
    }

    return {
      text: record.text,
      ...(typeof record.url === "string" ? { url: record.url } : {}),
      ...(typeof record.title === "string" ? { title: record.title } : {}),
    };
  } catch {
    return { text: raw };
  }
}

export function storedMessageToUiMessage(message: ChatMessageBody): Message | null {
  if (message.messageType === MESSAGE_TYPE.CAPTURE && message.role === "user") {
    return {
      id: message.id,
      role: "user",
      type: MESSAGE_TYPE.CAPTURE,
      content: parseCaptureContent(message.content),
    };
  }

  if (message.messageType === MESSAGE_TYPE.TEXT) {
    return {
      id: message.id,
      role: message.role,
      type: MESSAGE_TYPE.TEXT,
      content: message.content,
    };
  }

  if (message.messageType === MESSAGE_TYPE.QUICK_ACTION) {
    if (message.role === "user") {
      return {
        id: message.id,
        role: "user",
        type: MESSAGE_TYPE.QUICK_ACTION,
        content: message.content,
      };
    }

    return {
      id: message.id,
      role: "ezer",
      type: MESSAGE_TYPE.QUICK_ACTION,
      content: parseStoredChatContent(message.content),
    };
  }

  return null;
}
