import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.ts";

function sendCaptureMode(enabled: boolean): void {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;

  void chrome.runtime.sendMessage({
    target: "content",
    payload: {
      type: enabled ? RUNTIME_MESSAGE_TYPE.START_CAPTURE : RUNTIME_MESSAGE_TYPE.STOP_CAPTURE,
    },
  });
}

export function armCaptureMode(): void {
  sendCaptureMode(true);
}

export function disarmCaptureMode(): void {
  sendCaptureMode(false);
}
