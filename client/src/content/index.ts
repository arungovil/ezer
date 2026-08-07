// Ezer content script engine

import type { RecordedAction } from "../types.js";
import { buildSelectorChain } from "./selector-chain.js";

let isRecording = false;

function handleCaptureEvent(e: Event) {
  if (!isRecording) return;

  const target = e.target as HTMLElement | null;
  if (!target) return;

  const tagName = target.tagName.toLowerCase();
  const isInputEvent =
    e.type === "change" ||
    (e.type === "input" && (tagName === "input" || tagName === "textarea" || tagName === "select"));
  const type = isInputEvent ? "INPUT" : "CLICK";

  const selectors = buildSelectorChain(target);
  const rawText = (target.innerText || target.textContent || "").trim().replace(/\s+/g, " ");
  const innerText = rawText.slice(0, 50);

  const action: RecordedAction = {
    type,
    selectors,
    tagName,
    ...(innerText ? { innerText } : {}),
    ...(isInputEvent && "value" in target
      ? { value: String((target as HTMLInputElement).value) }
      : {}),
  };

  void chrome.runtime.sendMessage({
    type: "ACTION_RECORDED",
    action,
  });
}

window.addEventListener("click", handleCaptureEvent, true);
window.addEventListener("change", handleCaptureEvent, true);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "START_RECORDING") {
    isRecording = true;
    sendResponse({ ok: true });
  } else if (message?.type === "STOP_RECORDING") {
    isRecording = false;
    sendResponse({ ok: true });
  } else if (message?.type === "PING") {
    sendResponse({ ok: true });
  }
  return false;
});
