import { type Task, TaskStatus } from "@lit/task";
import type { CaptureResponseBody } from "@src/sidepanel/api/types.ts";
import type { CaptureTaskArgs, ChatWindowHost, Message } from "@src/sidepanel/types.ts";
import { MESSAGE_TYPE } from "@src/sidepanel/types.ts";
import { getActiveTabUrl } from "@src/sidepanel/utils/active-tab.ts";
import { toUserErrorMessage, userErrorMessages } from "@src/sidepanel/utils/user-message.ts";
import { userCaptureMessage } from "./messages.ts";

const captureDedupeMs = 3000;
let lastCapturedKey = "";
let lastCapturedAt = 0;

export async function handleSelectionCaptured(
  host: ChatWindowHost,
  captureTask: Task<CaptureTaskArgs, CaptureResponseBody>,
  text: string,
  url?: string,
  title?: string,
): Promise<void> {
  const tabUrl = url ?? (await getActiveTabUrl());
  if (!tabUrl) {
    return;
  }

  const normalizedText = text.trim();
  const captureKey = normalizedText;
  const now = Date.now();
  if (captureKey === lastCapturedKey && now - lastCapturedAt < captureDedupeMs) {
    return;
  }

  if (captureTask.status === TaskStatus.PENDING) {
    return;
  }

  lastCapturedKey = captureKey;
  lastCapturedAt = now;

  const userMsg = userCaptureMessage({
    text,
    ...(url ? { url } : {}),
    ...(title ? { title } : {}),
  });
  const ezerMsgId = crypto.randomUUID();
  const pendingEzerMsg: Message = {
    id: ezerMsgId,
    role: "ezer",
    type: MESSAGE_TYPE.TEXT,
    content: "",
    loading: true,
  };

  host.appendChatMessages(userMsg, pendingEzerMsg);

  try {
    void captureTask.run([text, tabUrl, url, title]);
    const result = await captureTask.taskComplete;
    host.messages = host.messages.map((message) => {
      if (message.id === userMsg.id && message.type === MESSAGE_TYPE.CAPTURE) {
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
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return;
    }

    const errorMessage = toUserErrorMessage(error, userErrorMessages.captureFailed);
    host.messages = host.messages.map((message) =>
      message.id === ezerMsgId && message.type === MESSAGE_TYPE.TEXT
        ? { ...message, content: `⚠️ **${errorMessage}**`, loading: false }
        : message,
    );
  }
}
