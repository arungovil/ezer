// Reports the user's text selection when capture mode is armed.

import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.ts";

const MAX_CAPTURE_LENGTH = 4000;
const MIN_SELECTION_LENGTH = 3;

let captureMode = false;
let listenersAttached = false;

export function startSelectionCapture(): void {
  if (listenersAttached) {
    return;
  }
  listenersAttached = true;
  window.addEventListener("mouseup", handleMouseUp);
}

export function setCaptureMode(enabled: boolean): void {
  captureMode = enabled;
}

function handleMouseUp(): void {
  if (!captureMode) {
    return;
  }

  try {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    if (text.length < MIN_SELECTION_LENGTH) {
      return;
    }

    void chrome.runtime
      .sendMessage({
        type: RUNTIME_MESSAGE_TYPE.CAPTURE_SELECTION,
        text: text.slice(0, MAX_CAPTURE_LENGTH),
        url: window.location.href,
        title: document.title,
      })
      .catch(() => {});
  } catch {
    window.removeEventListener("mouseup", handleMouseUp);
    listenersAttached = false;
    captureMode = false;
  }
}
