import { getActiveTabUrl } from "@src/shared/tabs/active-tab.js";
import type { Message } from "@src/shared/types.js";
import { getConversationMessages } from "@src/sidepanel/api/capture.js";
import { storedMessageToUiMessage } from "./message-mapper.js";

export async function loadCaptureConversationForActiveTab(): Promise<Message[]> {
  const tabUrl = await getActiveTabUrl();
  if (!tabUrl) {
    return [];
  }

  const result = await getConversationMessages(tabUrl);
  if (!result.ok) {
    return [];
  }

  return result.data.messages
    .map(storedMessageToUiMessage)
    .filter((message): message is Message => message !== null);
}
