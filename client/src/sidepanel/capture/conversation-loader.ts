import { getChatMessages } from "@src/sidepanel/api/chat.ts";
import type { Message } from "@src/sidepanel/types.ts";
import { getActiveTabUrl } from "@src/sidepanel/utils/index.ts";
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
