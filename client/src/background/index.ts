import { initializeUser } from "@src/shared/identity/initialize-user.ts";
import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.ts";
import { injectAndRetry } from "./fallbacks.ts";

void initializeUser();

let activeTabId: number | null = null;
let lastSelectionCaptureKey = "";
let lastSelectionCaptureAt = 0;

const selectionCaptureDedupeMs = 3000;

// Initialize active tab on startup
void (async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id != null) activeTabId = tab.id;
})();

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
    void handleCaptureSelection(message, sendResponse);
    return true;
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

async function handleCaptureSelection(
  message: { text?: unknown; url?: unknown; title?: unknown },
  sendResponse: (response: unknown) => void,
): Promise<void> {
  if (!(await isSidePanelOpen())) {
    sendResponse({ ok: false, reason: "panel-closed" });
    return;
  }

  if (typeof message.text !== "string" || !message.text.trim()) {
    sendResponse({ ok: false, reason: "empty-selection" });
    return;
  }

  const captureKey = `${message.url ?? ""}|${message.text.trim()}`;
  const now = Date.now();
  if (
    captureKey === lastSelectionCaptureKey &&
    now - lastSelectionCaptureAt < selectionCaptureDedupeMs
  ) {
    sendResponse({ ok: false, reason: "duplicate" });
    return;
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

async function isSidePanelOpen(): Promise<boolean> {
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.SIDE_PANEL],
    });
    return contexts.length > 0;
  } catch {
    return false;
  }
}
