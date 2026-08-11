import { RUNTIME_MESSAGE_TYPE } from "@src/message-constants.js";
import type { ChatWindowHost, Message, RecordedAction } from "@src/types.js";
import {
  recordingStartedMessage,
  recordingStoppedEmptyMessage,
  workflowCaptureMessage,
} from "./messages-handler.js";

export function clearPendingEmptyPlaceholder(host: ChatWindowHost): void {
  if (!host.pendingEmptyMsgId) return;
  host.messages = host.messages.filter((m) => m.id !== host.pendingEmptyMsgId);
  host.pendingEmptyMsgId = null;
}

export function appendWorkflowMessage(host: ChatWindowHost, actions: RecordedAction[]): void {
  host.messages = [...host.messages, workflowCaptureMessage(actions)];
}

export function handleStartRecording(host: ChatWindowHost): void {
  host.workflowStatus = "recording";

  const msg = recordingStartedMessage();
  host.messages = [...host.messages, msg];

  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;

  chrome.runtime
    .sendMessage({
      target: "content",
      payload: { type: RUNTIME_MESSAGE_TYPE.START_RECORDING },
    })
    .then((response: { error?: string }) => {
      if (response?.error) {
        host.workflowStatus = "idle";
        host.messages = host.messages.map((m) =>
          m.id === msg.id
            ? ({
                ...m,
                content:
                  "⚠️ **Can't record on this page.** Ezer works on regular websites, not browser settings or system pages.",
              } as Message)
            : m,
        );
      }
    })
    .catch(() => {
      host.workflowStatus = "idle";
      host.messages = host.messages.map((m) =>
        m.id === msg.id
          ? ({
              ...m,
              content: "⚠️ **Something went wrong and recording stopped.** Give it another try?",
            } as Message)
          : m,
      );
    });
}

export function handleStopRecording(host: ChatWindowHost): void {
  const stoppingMsg = recordingStoppedEmptyMessage();

  host.pendingEmptyMsgId = stoppingMsg.id;
  host.messages = [...host.messages, stoppingMsg];
  host.workflowStatus = "idle";

  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    void chrome.runtime.sendMessage({
      target: "content",
      payload: { type: RUNTIME_MESSAGE_TYPE.STOP_RECORDING },
    });
  }
}

export function handleRecordingComplete(host: ChatWindowHost, actions: RecordedAction[]): void {
  if (host.pendingEmptyMsgId) {
    if (actions.length === 0) {
      host.pendingEmptyMsgId = null;
      return;
    }
    host.messages = host.messages.filter((m) => m.id !== host.pendingEmptyMsgId);
    host.pendingEmptyMsgId = null;
  } else if (actions.length === 0) {
    host.messages = [...host.messages, recordingStoppedEmptyMessage()];
    return;
  }

  appendWorkflowMessage(host, actions);
}
