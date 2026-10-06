import { useQueryClient } from "@tanstack/react-query";

import { postChat } from "@src/sidepanel/api/index.ts";
import { applyChatReply } from "@src/sidepanel/capture/index.ts";
import { chatContentFromResponse, markdownChatContent } from "@src/sidepanel/chat-content.ts";
import {
  helpPrompt,
  noteListUserPrompt,
  reminderListUserPrompt,
} from "@src/sidepanel/constants.ts";
import type { Message, QuickActionId } from "@src/sidepanel/types.ts";
import { MESSAGE_TYPE } from "@src/sidepanel/types.ts";
import { getActiveTabUrl } from "@src/sidepanel/utils/index.ts";
import { toUserErrorMessage, userErrorMessages } from "@src/sidepanel/utils/user-message.ts";
import { conversationQueryKey } from "@src/ui/hooks/use-conversation.ts";

export function promptForQuickAction(action: QuickActionId): string {
  if (action === "notes") {
    return noteListUserPrompt;
  }
  if (action === "reminders") {
    return reminderListUserPrompt;
  }
  return helpPrompt;
}

export function useSendChat(siteScope: string | null | undefined) {
  const queryClient = useQueryClient();

  return async function sendChat(text: string, action?: QuickActionId) {
    if (siteScope === undefined) {
      return;
    }

    const messageType = action ? MESSAGE_TYPE.QUICK_ACTION : MESSAGE_TYPE.TEXT;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      type: messageType,
      content: text,
    };
    const ezerMsgId = crypto.randomUUID();
    const pendingEzerMsg: Message =
      messageType === MESSAGE_TYPE.QUICK_ACTION
        ? {
            id: ezerMsgId,
            role: "ezer",
            type: MESSAGE_TYPE.QUICK_ACTION,
            content: markdownChatContent(""),
            loading: true,
          }
        : {
            id: ezerMsgId,
            role: "ezer",
            type: MESSAGE_TYPE.TEXT,
            content: "",
            loading: true,
          };

    const queryKey = conversationQueryKey(siteScope);
    queryClient.setQueryData<Message[]>(queryKey, (current = []) => [
      ...current,
      userMsg,
      pendingEzerMsg,
    ]);

    try {
      const tabUrl = await getActiveTabUrl();
      if (!tabUrl) {
        throw new Error("No active tab URL");
      }

      const result = await postChat(text, tabUrl, { action });

      if (!result.ok) {
        throw new Error(result.message);
      }

      const content = action ? chatContentFromResponse(result.data) : result.data.reply;
      queryClient.setQueryData<Message[]>(queryKey, (current = []) =>
        applyChatReply(current, ezerMsgId, content, messageType),
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      const errorMessage = toUserErrorMessage(error, userErrorMessages.chatFailed);
      queryClient.setQueryData<Message[]>(queryKey, (current = []) =>
        applyChatReply(current, ezerMsgId, `⚠️ **${errorMessage}**`, messageType),
      );
    }
  };
}
