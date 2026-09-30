import { getActiveTabUrl } from "@src/shared/tabs/active-tab.ts";
import type { Message } from "@src/shared/types.ts";
import { getChatMessages } from "@src/sidepanel/api/chat.ts";
import { storedMessageToUiMessage } from "./message-mapper.ts";

export async function loadCaptureConversationForActiveTab(): Promise<Message[]> {
  const tabUrl = await getActiveTabUrl();
  if (!tabUrl) {
    return [];
  }

  const result = await getChatMessages(tabUrl);
  if (!result.ok) {
    return [];
  }

  return result.data.messages
    .map(storedMessageToUiMessage)
    .filter((message): message is Message => message !== null);
}
