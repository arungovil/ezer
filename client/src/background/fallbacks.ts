/**
 * Fallbacks for content script delivery failures.
 *
 * Each function takes a tab ID and payload, performs a recovery action,
 * and retries the message. Throws if the fallback itself fails.
 */

export async function injectAndRetry(tabId: number, payload: unknown): Promise<unknown> {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["dist/content.js"],
  });

  return await chrome.tabs.sendMessage(tabId, payload);
}
