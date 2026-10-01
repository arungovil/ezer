import { Task } from "@lit/task";
import type { ChatContent } from "@src/shared/chat-content.ts";
import { chatContentFromResponse } from "@src/shared/chat-content.ts";
import type { QuickActionId } from "@src/shared/constants.ts";
import { getActiveTabUrl } from "@src/shared/tabs/active-tab.ts";
import { postChat } from "@src/sidepanel/api/index.ts";
import type { ReactiveControllerHost } from "lit";

export type ChatTaskArgs = readonly [text: string, ezerMsgId: string, action?: QuickActionId];

export interface ChatTaskResult {
  ezerMsgId: string;
  content: string | ChatContent;
}

export function createChatTask(host: ReactiveControllerHost) {
  return new Task<ChatTaskArgs, ChatTaskResult>(host, {
    autoRun: false,
    task: async ([text, ezerMsgId, action], { signal }) => {
      const tabUrl = await getActiveTabUrl();
      if (!tabUrl) {
        throw new Error("No active tab URL");
      }

      const result = await postChat(text, tabUrl, { signal, action });

      if (!result.ok) {
        throw new Error(result.message);
      }

      const content = action ? chatContentFromResponse(result.data) : result.data.reply;

      return { ezerMsgId, content };
    },
  });
}
