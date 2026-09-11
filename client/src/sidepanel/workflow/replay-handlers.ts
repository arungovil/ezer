import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.js";
import type { ChatWindowHost, RecordedAction } from "@src/shared/types.js";
import { MESSAGE_TYPE } from "@src/shared/types.js";
import { ezerStatusMessage } from "./messages-handler.js";

export function beginReplay(
  host: ChatWindowHost,
  messageId: string,
  actions: RecordedAction[],
): void {
  host.replayingMessageId = messageId;
  host.workflowStatus = "replaying";
  host.pendingReplayError = null;

  host.messages = host.messages.map((m) => {
    if (m.id !== messageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
    return { ...m, content: { ...m.content, replaying: true } };
  });

  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    void chrome.runtime.sendMessage({
      target: "content",
      payload: { type: RUNTIME_MESSAGE_TYPE.REPLAY_ACTIONS, actions },
    });
  }
}

export function handleReplay(
  host: ChatWindowHost,
  e: CustomEvent<{ actions: RecordedAction[] }>,
): void {
  const { actions } = e.detail;

  const message = host.messages.find(
    (m): m is Extract<(typeof host.messages)[number], { type: typeof MESSAGE_TYPE.WORKFLOW }> =>
      m.type === MESSAGE_TYPE.WORKFLOW && m.content.actions === actions,
  );
  if (!message) return;

  beginReplay(host, message.id, actions);
}

export function handleReplayFailed(host: ChatWindowHost, error: string): void {
  host.pendingReplayError = error;
}

export function finishReplay(host: ChatWindowHost): void {
  if (!host.replayingMessageId) return;

  host.messages = host.messages.map((m) => {
    if (m.id !== host.replayingMessageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
    return { ...m, content: { ...m.content, replaying: false } };
  });

  if (host.pendingReplayError) {
    host.messages = [...host.messages, ezerStatusMessage(host.pendingReplayError)];
    host.pendingReplayError = null;
  } else {
    host.messages = [
      ...host.messages,
      ezerStatusMessage("✅ **All done! Your workflow completed successfully.**"),
    ];
  }

  host.replayingMessageId = null;
  host.workflowStatus = "idle";
}
