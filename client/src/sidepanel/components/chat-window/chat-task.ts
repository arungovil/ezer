import { Task } from "@lit/task";
import { postChat } from "@src/sidepanel/api/index.js";
import type { ReactiveControllerHost } from "lit";

export type ChatTaskArgs = readonly [text: string, ezerMsgId: string];

export interface ChatTaskResult {
  ezerMsgId: string;
  reply: string;
}

export function createChatTask(host: ReactiveControllerHost) {
  return new Task<ChatTaskArgs, ChatTaskResult>(host, {
    autoRun: false,
    task: async ([text, ezerMsgId], { signal }) => {
      const result = await postChat(text, { signal });

      if (!result.ok) {
        throw new Error(result.message);
      }

      return { ezerMsgId, reply: result.data.reply };
    },
  });
}
