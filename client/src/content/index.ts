// Ezer content script engine

import type { RecordedAction } from "@src/types.js";
import { buildSelectorChain } from "./selector-chain.js";

let isRecording = false;
const actionBuffer: RecordedAction[] = [];

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

  actionBuffer.push(action);
}

window.addEventListener("click", handleCaptureEvent, true);
window.addEventListener("change", handleCaptureEvent, true);

function handleStartRecording() {
  isRecording = true;
  actionBuffer.length = 0;
}

function handleStopRecording() {
  isRecording = false;
  void chrome.runtime.sendMessage({
    type: "RECORDING_COMPLETE",
    actions: [...actionBuffer],
  });
  actionBuffer.length = 0;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message?.type) {
    case "START_RECORDING":
      handleStartRecording();
      sendResponse({ ok: true });
      break;
    case "STOP_RECORDING":
      handleStopRecording();
      sendResponse({ ok: true });
      break;
    case "PING":
      sendResponse({ ok: true });
      break;
  }
  return false;
});
