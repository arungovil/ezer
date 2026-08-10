// Ezer background service worker

import type { RecordedAction } from "@src/types.js";
import { injectAndRetry } from "./fallbacks.js";

let isRecording = false;
const actionBuffer: RecordedAction[] = [];
let activeTabId: number | null = null;

// Initialize active tab on startup
void (async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id != null) activeTabId = tab.id;
})();

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Detect tab switches — reset all recording state
chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (activeTabId === tabId) return;
  activeTabId = tabId;

  if (isRecording) {
    isRecording = false;
    actionBuffer.length = 0;
  }

  // Notify sidepanel so it can reset and show the tab-switched message
  chrome.runtime.sendMessage({ type: "TAB_SWITCHED", tabId }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Direct messages from content script
  if (message?.type === "ACTION_CAPTURED") {
    if (isRecording && message.action) {
      actionBuffer.push(message.action);
    }
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === "GET_RECORDING_STATE") {
    sendResponse({ isRecording });
    return false;
  }

  if (message?.type === "REPLAY_COMPLETE" || message?.type === "REPLAY_ERROR") {
    // Broadcast from content back to sidepanel
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ ok: true });
    return false;
  }

  // Messages from sidepanel, routed to content script
  if (message?.target !== "content") return;

  if (message.payload?.type === "START_RECORDING") {
    handleStartRecording(message.payload, sendResponse);
    return true;
  }

  if (message.payload?.type === "STOP_RECORDING") {
    handleStopRecording(message.payload, sendResponse);
    return true;
  }

  // Unknown payload type — forward to content as-is
  void deliverToContent(message.payload, sendResponse);
  return true;
});

async function handleStartRecording(payload: unknown, sendResponse: (response: unknown) => void) {
  isRecording = true;
  actionBuffer.length = 0;

  // Update activeTabId in case it wasn't initialized (edge case)
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id != null) activeTabId = tab.id;

  const response = await deliverToContentAsync(payload);
  if (isErrorResponse(response)) {
    isRecording = false;
  }
  sendResponse(response);
}

async function handleStopRecording(payload: unknown, sendResponse: (response: unknown) => void) {
  if (!isRecording) {
    sendResponse({ ok: true });
    return;
  }

  isRecording = false;

  // Snapshot the buffer before forwarding STOP; the content script may
  // still be capturing on the current page.
  const captured = [...actionBuffer];
  actionBuffer.length = 0;

  await deliverToContent(payload, () => {});

  // Broadcast to sidepanel
  chrome.runtime
    .sendMessage({
      type: "RECORDING_COMPLETE",
      actions: captured,
    })
    .catch(() => {});

  sendResponse({ ok: true });
}

function deliverToContentAsync(payload: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    void deliverToContent(payload, resolve);
  });
}

function isErrorResponse(response: unknown): response is { error: string } {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    typeof (response as { error: unknown }).error === "string"
  );
}

async function deliverToContent(payload: unknown, sendResponse: (response: unknown) => void) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    sendResponse({ error: "no active tab" });
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, payload);
    sendResponse(response);
  } catch (err) {
    await handleDeliveryError(tab.id, payload, err, sendResponse);
  }
}

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
  return safeErrorMessage(err).includes("Receiving end does not exist");
}

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
