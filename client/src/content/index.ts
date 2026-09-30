// Ezer content script engine

import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.ts";
import { setCaptureMode, startSelectionCapture } from "./capture/selection-capture.ts";

const contentScriptKey = "__ezerContentScript";
const windowWithGuard = window as unknown as Record<string, boolean | undefined>;

if (windowWithGuard[contentScriptKey]) {
  // executeScript reinjection can load this bundle twice in the same frame.
} else {
  windowWithGuard[contentScriptKey] = true;
  boot();
}

function boot(): void {
  startSelectionCapture();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message?.type) {
      case RUNTIME_MESSAGE_TYPE.START_CAPTURE:
        setCaptureMode(true);
        sendResponse({ ok: true });
        break;
      case RUNTIME_MESSAGE_TYPE.STOP_CAPTURE:
        setCaptureMode(false);
        sendResponse({ ok: true });
        break;
      case RUNTIME_MESSAGE_TYPE.PING:
        sendResponse({ ok: true });
        break;
    }
    return false;
  });
}
