import { getChatMessages } from "@src/sidepanel/api/chat.ts";
import type { ChatListResponseBody } from "@src/sidepanel/api/types.ts";
import type { Conversation, Message } from "@src/sidepanel/types.ts";
import { getActiveTabUrl } from "@src/sidepanel/utils/index.ts";

import { storedMessageToUiMessage } from "./message-mapper.ts";

function toConversation(body: ChatListResponseBody): Conversation {
  return {
    messages: body.messages
      .map(storedMessageToUiMessage)
      .filter((message): message is Message => message !== null),
    hasMore: body.hasMore,
  };
}

/** Loads the newest page of the active site's thread. A failure shows as an empty thread. */
export async function loadCaptureConversationForActiveTab(): Promise<Conversation> {
  const tabUrl = await getActiveTabUrl();
  if (!tabUrl) {
    return { messages: [], hasMore: false };
  }

  const result = await getChatMessages(tabUrl);
  if (!result.ok) {
    return { messages: [], hasMore: false };
  }

  return toConversation(result.data);
}

/**
 * Loads the page of messages just older than `before`. Unlike the first load this throws, so
 * the UI can offer a retry instead of silently pretending history ended.
 */
export async function loadOlderMessages(siteUrl: string, before: string): Promise<Conversation> {
  const result = await getChatMessages(siteUrl, { before });
  if (!result.ok) {
    throw new Error(result.message);
  }

  return toConversation(result.data);
}
