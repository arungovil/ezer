import { isChatTaskListContent, normalizeChatContent } from "@src/sidepanel/chat-content.ts";
import type { ChatContent } from "@src/sidepanel/types.ts";
import { Markdown } from "@src/ui/components/common/markdown/index.tsx";

import { TaskList } from "./task-list/index.tsx";

export function MessageBubbleQuickAction({ content }: { content: string | ChatContent }) {
  const resolved = normalizeChatContent(content);

  if (isChatTaskListContent(resolved)) {
    return <TaskList content={resolved} />;
  }

  return <Markdown text={resolved.text} />;
}
