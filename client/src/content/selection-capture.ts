// Reports the user's text selection to the background worker. The background
// decides whether to route it (only when the Ezer side panel is open).

import { RUNTIME_MESSAGE_TYPE } from "@src/message-constants.js";

const MAX_CAPTURE_LENGTH = 4000;

export function startSelectionCapture(): void {
  window.addEventListener("mouseup", handleMouseUp);
}

function handleMouseUp(): void {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const text = selection.toString().trim();
  if (!text) return;

  chrome.runtime
    .sendMessage({
      type: RUNTIME_MESSAGE_TYPE.CAPTURE_SELECTION,
      text: text.slice(0, MAX_CAPTURE_LENGTH),
      url: window.location.href,
      title: document.title,
    })
    .catch(() => {});
}
