// Ezer content script engine

import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.js";
import { setCaptureMode, startSelectionCapture } from "./capture/selection-capture.js";
import { eventHandlers } from "./workflow/handlers.js";
import { runReplay } from "./workflow/replay/index.js";

let isRecording = false;

void (async function init() {
  try {
    const state = await chrome.runtime.sendMessage({
      type: RUNTIME_MESSAGE_TYPE.GET_RECORDING_STATE,
    });
    if (state?.isRecording) {
      isRecording = true;
    }
  } catch {}
})();

// Event listeners
window.addEventListener("click", handleCaptureEvent, true);
window.addEventListener("change", handleCaptureEvent, true);
window.addEventListener("submit", handleCaptureEvent, true);

// Text-selection capture (independent of workflow recording)
startSelectionCapture();

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
  chrome.runtime
    .sendMessage({ type: RUNTIME_MESSAGE_TYPE.ACTION_CAPTURED, action })
    .catch(() => {});
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message?.type) {
    case RUNTIME_MESSAGE_TYPE.START_RECORDING:
      isRecording = true;
      sendResponse({ ok: true });
      break;
    case RUNTIME_MESSAGE_TYPE.STOP_RECORDING:
      isRecording = false;
      sendResponse({ ok: true });
      break;
    case RUNTIME_MESSAGE_TYPE.START_CAPTURE:
      setCaptureMode(true);
      sendResponse({ ok: true });
      break;
    case RUNTIME_MESSAGE_TYPE.STOP_CAPTURE:
      setCaptureMode(false);
      sendResponse({ ok: true });
      break;
    case RUNTIME_MESSAGE_TYPE.REPLAY_ACTIONS:
      if (message.actions && Array.isArray(message.actions)) {
        void runReplay(message.actions);
      }
      sendResponse({ ok: true });
      break;
    case RUNTIME_MESSAGE_TYPE.PING:
      sendResponse({ ok: true });
      break;
  }
  return false;
});
