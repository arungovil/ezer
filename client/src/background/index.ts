// Ezer background service worker

import type { RecordedAction } from "@src/types.js";
import { injectAndRetry } from "./fallbacks.js";

let isRecording = false;
const actionBuffer: RecordedAction[] = [];

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
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

  await deliverToContent(payload, sendResponse);
}

async function handleStopRecording(payload: unknown, sendResponse: (response: unknown) => void) {
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
