import type { Task } from "@lit/task";
import { getActiveTabUrl } from "@src/shared/tabs/active-tab.js";
import type { ChatWindowHost, Message } from "@src/shared/types.js";
import { MESSAGE_TYPE } from "@src/shared/types.js";
import type { CaptureResponseBody } from "@src/sidepanel/api/types.js";
import type { CaptureTaskArgs } from "./capture-task.js";
import { userCaptureMessage } from "./messages.js";

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

  host.messages = [...host.messages, userMsg, pendingEzerMsg];

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

    const errorMessage = error instanceof Error ? error.message : "Something went wrong.";
    host.messages = host.messages.map((message) =>
      message.id === ezerMsgId && message.type === MESSAGE_TYPE.TEXT
        ? { ...message, content: errorMessage, loading: false }
        : message,
    );
  }
}
