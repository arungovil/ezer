// Ezer background service worker

import { injectAndRetry } from "./fallbacks.js";

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== "content") return;

  void (async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      sendResponse({ error: "no active tab" });
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(tab.id, message.payload);
      sendResponse(response);
    } catch (err) {
      await handleDeliveryError(tab.id, message.payload, err, sendResponse);
    }
  })();

  return true;
});

async function handleDeliveryError(
  tabId: number,
  payload: unknown,
  err: unknown,
  sendResponse: (response: unknown) => void,
) {
  if (isNoReceiver(err)) {
    try {
      const response = await injectAndRetry(tabId, payload);
      sendResponse(response);
      return;
    } catch (fallbackErr) {
      sendResponse({ error: safeErrorMessage(fallbackErr) });
      return;
    }
  }

  sendResponse({ error: safeErrorMessage(err) });
}

function isNoReceiver(err: unknown): boolean {
  const msg = safeErrorMessage(err);
  return msg.includes("Receiving end does not exist");
}

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
