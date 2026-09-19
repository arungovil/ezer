// Fallbacks for content script delivery failures.

import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.js";

export async function injectAndRetry(tabId: number, payload: unknown): Promise<unknown> {
  try {
    const ping = await chrome.tabs.sendMessage(tabId, { type: RUNTIME_MESSAGE_TYPE.PING });
    if (ping?.ok) {
      return await chrome.tabs.sendMessage(tabId, payload);
    }
  } catch {
    // Content script not loaded yet.
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["dist/content.js"],
  });

  return await chrome.tabs.sendMessage(tabId, payload);
}
