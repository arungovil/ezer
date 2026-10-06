import { normalizeChatContent } from "@src/sidepanel/chat-content.ts";
import type { ChatContent, Message } from "@src/sidepanel/types.ts";
import { MESSAGE_TYPE } from "@src/sidepanel/types.ts";

export function applyChatReply(
  messages: Message[],
  ezerMsgId: string,
  content: string | ChatContent,
  messageType: typeof MESSAGE_TYPE.TEXT | typeof MESSAGE_TYPE.QUICK_ACTION,
): Message[] {
  return messages.map((message) => {
    if (message.id !== ezerMsgId || message.type !== messageType || message.role !== "ezer") {
      return message;
    }

    if (messageType === MESSAGE_TYPE.QUICK_ACTION && message.type === MESSAGE_TYPE.QUICK_ACTION) {
      return { ...message, content: normalizeChatContent(content), loading: false };
    }

    if (messageType === MESSAGE_TYPE.TEXT && message.type === MESSAGE_TYPE.TEXT) {
      return { ...message, content: typeof content === "string" ? content : "", loading: false };
    }

    return message;
  });
}

export function applyCaptureSuccess(
  messages: Message[],
  userMsgId: string,
  ezerMsgId: string,
  result: { userMessageId: string; ezerMessageId: string; reply: string },
): Message[] {
  return messages.map((message) => {
    if (message.id === userMsgId && message.type === MESSAGE_TYPE.CAPTURE) {
      return { ...message, id: result.userMessageId };
    }
    if (message.id === ezerMsgId && message.type === MESSAGE_TYPE.TEXT) {
      return {
        ...message,
        id: result.ezerMessageId,
        content: result.reply,
        loading: false,
      };
    }
    return message;
  });
}

export function applyEzerText(messages: Message[], ezerMsgId: string, content: string): Message[] {
  return messages.map((message) =>
    message.id === ezerMsgId && message.type === MESSAGE_TYPE.TEXT
      ? { ...message, content, loading: false }
      : message,
  );
}
