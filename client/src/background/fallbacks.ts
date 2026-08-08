// Fallbacks for content script delivery failures.

export async function injectAndRetry(tabId: number, payload: unknown): Promise<unknown> {
  // Re-inject the content script, then retry the message. Throws on failure.
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["dist/content.js"],
  });

  return await chrome.tabs.sendMessage(tabId, payload);
}
