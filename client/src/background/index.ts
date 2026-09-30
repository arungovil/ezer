import { initializeUser } from "@src/shared/identity/initialize-user.ts";
import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.ts";
import { injectAndRetry } from "./fallbacks.ts";

void initializeUser();

let sidepanelOpen = false;
let activeTabId: number | null = null;
let lastSelectionCaptureKey = "";
let lastSelectionCaptureAt = 0;

const selectionCaptureDedupeMs = 3000;

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
  void initializeUser();
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (activeTabId === tabId) return;
  activeTabId = tabId;

  chrome.runtime.sendMessage({ type: RUNTIME_MESSAGE_TYPE.TAB_SWITCHED, tabId }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === RUNTIME_MESSAGE_TYPE.CAPTURE_SELECTION) {
    if (!sidepanelOpen) {
      sendResponse({ ok: false, reason: "panel-closed" });
      return false;
    }

    if (typeof message.text !== "string" || !message.text.trim()) {
      sendResponse({ ok: false, reason: "empty-selection" });
      return false;
    }

    const captureKey = `${message.url ?? ""}|${message.text.trim()}`;
    const now = Date.now();
    if (
      captureKey === lastSelectionCaptureKey &&
      now - lastSelectionCaptureAt < selectionCaptureDedupeMs
    ) {
      sendResponse({ ok: false, reason: "duplicate" });
      return false;
    }

    lastSelectionCaptureKey = captureKey;
    lastSelectionCaptureAt = now;

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

  if (message?.target !== "content") return;

  if (
    message.payload?.type === RUNTIME_MESSAGE_TYPE.START_CAPTURE ||
    message.payload?.type === RUNTIME_MESSAGE_TYPE.STOP_CAPTURE
  ) {
    void deliverToContent(message.payload, sendResponse);
    return true;
  }

  void deliverToContent(message.payload, sendResponse);
  return true;
});

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
