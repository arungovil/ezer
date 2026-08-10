// Ezer content script engine

import { runReplay } from "@src/replay/index.js";
import { eventHandlers } from "./handlers.js";

let isRecording = false;

void (async function init() {
  try {
    const state = await chrome.runtime.sendMessage({ type: "GET_RECORDING_STATE" });
    if (state?.isRecording) {
      isRecording = true;
    }
  } catch {}
})();

// Event listeners
window.addEventListener("click", handleCaptureEvent, true);
window.addEventListener("change", handleCaptureEvent, true);
window.addEventListener("submit", handleCaptureEvent, true);

// Main dispatcher
function handleCaptureEvent(e: Event) {
  if (!isRecording) return;

  const target = e.target as HTMLElement | null;
  if (!target) return;

  const handler = eventHandlers[e.type];
  if (!handler) return;

  const action = handler(target);
  if (!action) return;

  // Send captured event to background worker
  chrome.runtime.sendMessage({ type: "ACTION_CAPTURED", action }).catch(() => {});
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message?.type) {
    case "START_RECORDING":
      isRecording = true;
      sendResponse({ ok: true });
      break;
    case "STOP_RECORDING":
      isRecording = false;
      sendResponse({ ok: true });
      break;
    case "REPLAY_ACTIONS":
      if (message.actions && Array.isArray(message.actions)) {
        void runReplay(message.actions);
      }
      sendResponse({ ok: true });
      break;
    case "PING":
      sendResponse({ ok: true });
      break;
  }
  return false;
});
