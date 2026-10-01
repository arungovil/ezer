import { Task } from "@lit/task";
import { postChat } from "@src/sidepanel/api/index.ts";
import { chatContentFromResponse } from "@src/sidepanel/chat-content.ts";
import type { ChatTaskArgs, ChatTaskResult } from "@src/sidepanel/types.ts";
import { getActiveTabUrl } from "@src/sidepanel/utils/active-tab.ts";
import type { ReactiveControllerHost } from "lit";

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
