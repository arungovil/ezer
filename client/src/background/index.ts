import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.js";
import type { RecordedAction } from "@src/shared/types.js";
import { injectAndRetry } from "./fallbacks.js";

let isRecording = false;
let sidepanelOpen = false;
const actionBuffer: RecordedAction[] = [];
let activeTabId: number | null = null;

// Initialize active tab on startup
void (async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id != null) activeTabId = tab.id;
})();

// The side panel keeps a long-lived port open while it's visible. MV3 has no
// "is the panel open?" API, so this port is the source of truth for that.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "ezer-sidepanel") return;
  sidepanelOpen = true;
  port.onDisconnect.addListener(() => {
    sidepanelOpen = false;
  });
});

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
  chrome.runtime.sendMessage({ type: RUNTIME_MESSAGE_TYPE.TAB_SWITCHED, tabId }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Direct messages from content script
  if (message?.type === RUNTIME_MESSAGE_TYPE.ACTION_CAPTURED) {
    if (isRecording && message.action) {
      actionBuffer.push(message.action);
    }
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === RUNTIME_MESSAGE_TYPE.GET_RECORDING_STATE) {
    sendResponse({ isRecording });
    return false;
  }

  if (message?.type === RUNTIME_MESSAGE_TYPE.CAPTURE_SELECTION) {
    if (!sidepanelOpen) {
      sendResponse({ ok: false, reason: "panel-closed" });
      return false;
    }

    if (typeof message.text !== "string" || !message.text.trim()) {
      sendResponse({ ok: false, reason: "empty-selection" });
      return false;
    }

    chrome.runtime
      .sendMessage({
        type: RUNTIME_MESSAGE_TYPE.SELECTION_CAPTURED,
        text: message.text,
        url: message.url,
        title: message.title,
      })
      .catch(() => {});
    sendResponse({ ok: true });
    return false;
  }

  if (
    message?.type === RUNTIME_MESSAGE_TYPE.REPLAY_COMPLETE ||
    message?.type === RUNTIME_MESSAGE_TYPE.REPLAY_FAILED
  ) {
    // Broadcast from content back to sidepanel
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ ok: true });
    return false;
  }

  // Messages from sidepanel, routed to content script
  if (message?.target !== "content") return;

  if (message.payload?.type === RUNTIME_MESSAGE_TYPE.START_RECORDING) {
    handleStartRecording(message.payload, sendResponse);
    return true;
  }

  if (message.payload?.type === RUNTIME_MESSAGE_TYPE.STOP_RECORDING) {
    handleStopRecording(message.payload, sendResponse);
    return true;
  }

  if (message.payload?.type === RUNTIME_MESSAGE_TYPE.START_CAPTURE) {
    void deliverToContent(message.payload, sendResponse);
    return true;
  }

  if (message.payload?.type === RUNTIME_MESSAGE_TYPE.STOP_CAPTURE) {
    void deliverToContent(message.payload, sendResponse);
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
      type: RUNTIME_MESSAGE_TYPE.RECORDING_COMPLETE,
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
