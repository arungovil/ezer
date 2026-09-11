// Reports the user's text selection when capture mode is armed.

import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.js";

const MAX_CAPTURE_LENGTH = 4000;

let captureMode = false;

export function startSelectionCapture(): void {
  window.addEventListener("mouseup", handleMouseUp);
}

export function setCaptureMode(enabled: boolean): void {
  captureMode = enabled;
}

export function isCaptureModeActive(): boolean {
  return captureMode;
}

function handleMouseUp(): void {
  if (!captureMode) return;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const text = selection.toString().trim();
  if (!text) return;

  captureMode = false;

  chrome.runtime
    .sendMessage({
      type: RUNTIME_MESSAGE_TYPE.CAPTURE_SELECTION,
      text: text.slice(0, MAX_CAPTURE_LENGTH),
      url: window.location.href,
      title: document.title,
    })
    .catch(() => {});
}
