import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.ts";
import type { ChatWindowHost, Message } from "@src/shared/types.ts";
import { captureStartedMessage } from "./messages.ts";

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

export function handleStopCaptureMode(): void {
  disarmCaptureMode();
}

export function syncCaptureMode(_host: ChatWindowHost): void {
  armCaptureMode();
}

export function handleStartCapture(host: ChatWindowHost): void {
  const msg = captureStartedMessage();
  host.messages = [...host.messages, msg];

  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;

  chrome.runtime
    .sendMessage({
      target: "content",
      payload: { type: RUNTIME_MESSAGE_TYPE.START_CAPTURE },
    })
    .then((response: { error?: string }) => {
      if (response?.error) {
        host.messages = host.messages.map((m) =>
          m.id === msg.id
            ? ({
                ...m,
                content:
                  "⚠️ **Can't capture on this page.** Ezer works on regular websites, not browser settings or system pages.",
              } as Message)
            : m,
        );
      }
    })
    .catch(() => {
      host.messages = host.messages.map((m) =>
        m.id === msg.id
          ? ({
              ...m,
              content: "⚠️ **Something went wrong.** Couldn't arm highlight capture — try again?",
            } as Message)
          : m,
      );
    });
}
