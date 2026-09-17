import { recordingStartedMessage as recordingStartedText } from "@src/shared/constants.js";
import type { Message, RecordedAction, Workflow, WorkflowContent } from "@src/shared/types.js";
import { MESSAGE_TYPE } from "@src/shared/types.js";

function newId(): string {
  return crypto.randomUUID();
}

export function ezerStatusMessage(content: string): Message {
  return {
    id: newId(),
    role: "ezer",
    type: MESSAGE_TYPE.RECORDING,
    content,
  };
}

export function userTextMessage(content: string): Message {
  return {
    id: newId(),
    role: "user",
    type: MESSAGE_TYPE.TEXT,
    content,
  };
}

export function recordingStartedMessage(): Message {
  return ezerStatusMessage(recordingStartedText);
}

export function recordingStoppedEmptyMessage(): Message {
  return ezerStatusMessage(
    "⏹️ **Recording stopped.** I didn't catch any actions — give it another try?",
  );
}

export function recordingStoppedByTabSwitchMessage(): Message {
  return ezerStatusMessage(
    "⏹️ **Recording stopped.** Switching tabs ends an in-progress recording. Start again when you're ready.",
  );
}

export function tabSwitchedMessage(): Message {
  return ezerStatusMessage("🔄 **You switched tabs.** This chat is for the current page.");
}

function formatCapturedActions(actions: RecordedAction[]): string {
  const lines = actions.map((action, i) => {
    const primarySelector = action.selectors[0] || action.tagName;
    const valueDetail = action.value !== undefined ? ` (value: "${action.value}")` : "";
    const textDetail = action.innerText && !action.value ? ` ("${action.innerText}")` : "";
    return `${i + 1}. \`${action.type}\` on \`${primarySelector}\`${valueDetail}${textDetail}`;
  });

  return `⏹️ **Recording stopped.** ${actions.length} step${actions.length > 1 ? "s" : ""} captured:\n\n${lines.join("\n")}`;
}

export function workflowCaptureMessage(actions: RecordedAction[]): Message {
  return {
    id: newId(),
    role: "ezer",
    type: MESSAGE_TYPE.WORKFLOW,
    content: {
      text: formatCapturedActions(actions),
      actions,
      replaying: false,
      saved: false,
    } satisfies WorkflowContent,
  };
}

export function savedWorkflowReplayMessage(workflow: Workflow): Message {
  const textContent = `▶ **${workflow.name}** — ${workflow.actions.length} step${workflow.actions.length === 1 ? "" : "s"}`;

  return {
    id: newId(),
    role: "ezer",
    type: MESSAGE_TYPE.WORKFLOW,
    content: {
      text: textContent,
      actions: workflow.actions,
      replaying: false,
      saved: true,
    } satisfies WorkflowContent,
  };
}
