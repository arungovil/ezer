import { workflowListIntro, workflowListUserPrompt } from "@src/shared/constants.js";
import type {
  ChatWindowHost,
  Message,
  RecordedAction,
  Workflow,
  WorkflowListContent,
} from "@src/shared/types.js";
import { MESSAGE_TYPE } from "@src/shared/types.js";
import { userErrorMessages } from "@src/sidepanel/utils/user-message.js";
import {
  deleteWorkflow,
  getWorkflowsByTabId,
  saveWorkflow,
} from "@src/sidepanel/workflow/db/store.js";
import {
  ezerStatusMessage,
  savedWorkflowReplayMessage,
  userTextMessage,
} from "./messages-handler.js";
import { beginReplay } from "./replay-handlers.js";

export function clearPendingWorkflowSave(host: ChatWindowHost): void {
  if (!host.pendingWorkflowSave) return;

  const { messageId } = host.pendingWorkflowSave;
  host.pendingWorkflowSave = null;
  host.messages = host.messages.map((m) => {
    if (m.id !== messageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
    return { ...m, content: { ...m.content, awaitingName: false } };
  });
}

export async function refreshSavedWorkflows(host: ChatWindowHost): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    host.savedWorkflows = [];
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      host.savedWorkflows = [];
      return;
    }

    const workflows = await getWorkflowsByTabId(tab.id);
    host.savedWorkflows = workflows.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    host.savedWorkflows = [];
  }
}

export function handleSave(
  host: ChatWindowHost,
  e: CustomEvent<{ actions: RecordedAction[] }>,
): void {
  const { actions } = e.detail;

  const message = host.messages.find(
    (m): m is Extract<Message, { type: typeof MESSAGE_TYPE.WORKFLOW }> =>
      m.type === MESSAGE_TYPE.WORKFLOW && m.content.actions === actions,
  );
  if (!message || message.content.saved || message.content.awaitingName) return;
  if (host.pendingWorkflowSave) return;

  host.pendingWorkflowSave = { messageId: message.id, actions };

  host.messages = host.messages.map((m) => {
    if (m.id !== message.id || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
    return { ...m, content: { ...m.content, awaitingName: true } };
  });

  host.messages = [
    ...host.messages,
    ezerStatusMessage("💾 **Give this workflow a name to save it.**"),
  ];
}

export async function completeWorkflowSave(host: ChatWindowHost, name: string): Promise<void> {
  const pending = host.pendingWorkflowSave;
  if (!pending) return;

  host.messages = [...host.messages, userTextMessage(name)];
  host.pendingWorkflowSave = null;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      host.messages = host.messages.map((m) => {
        if (m.id !== pending.messageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
        return { ...m, content: { ...m.content, awaitingName: false } };
      });
      host.messages = [
        ...host.messages,
        ezerStatusMessage(
          "⚠️ **Hmm, something went wrong.** Couldn't find the page to save to. Try again?",
        ),
      ];
      return;
    }

    const workflow: Workflow = {
      id: crypto.randomUUID(),
      tabId: tab.id,
      url: tab.url ?? "",
      name,
      actions: pending.actions,
      createdAt: Date.now(),
    };

    await saveWorkflow(workflow);

    host.messages = host.messages.map((m) => {
      if (m.id !== pending.messageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
      return { ...m, content: { ...m.content, saved: true, awaitingName: false } };
    });

    host.messages = [...host.messages, ezerStatusMessage(`✅ **Got it! Saved as "${name}".**`)];
    void refreshSavedWorkflows(host);
  } catch {
    host.messages = host.messages.map((m) => {
      if (m.id !== pending.messageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
      return { ...m, content: { ...m.content, awaitingName: false } };
    });
    host.messages = [
      ...host.messages,
      ezerStatusMessage(`⚠️ **${userErrorMessages.workflowSaveFailed}**`),
    ];
  }
}

export function startWorkflowReplay(host: ChatWindowHost, workflow: Workflow): void {
  if (workflow.actions.length === 0) return;

  const msg = savedWorkflowReplayMessage(workflow);
  host.messages = [...host.messages, msg];
  beginReplay(host, msg.id, workflow.actions);
}

export function handleSelectWorkflow(
  host: ChatWindowHost,
  e: CustomEvent<{ workflow: Workflow }>,
): void {
  startWorkflowReplay(host, e.detail.workflow);
}

export function handlePlayWorkflow(
  host: ChatWindowHost,
  e: CustomEvent<{ workflow: Workflow }>,
  resetChat: () => void,
): void {
  const { workflow } = e.detail;
  if (workflow.actions.length === 0) return;

  resetChat();
  startWorkflowReplay(host, workflow);
}

export async function appendWorkflowListMessage(host: ChatWindowHost): Promise<void> {
  await refreshSavedWorkflows(host);

  const newMessages: Message[] = [
    userTextMessage(workflowListUserPrompt),
    ezerStatusMessage(workflowListIntro(host.savedWorkflows.length)),
  ];

  if (host.savedWorkflows.length > 0) {
    newMessages.push({
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.WORKFLOW_LIST,
      content: {
        workflows: host.savedWorkflows,
      } satisfies WorkflowListContent,
    });
  }

  host.messages = [...host.messages, ...newMessages];
}

export async function handleDeleteWorkflow(
  host: ChatWindowHost,
  e: CustomEvent<{ workflow: Workflow }>,
): Promise<void> {
  const { workflow } = e.detail;

  try {
    await deleteWorkflow(workflow.id);

    host.messages = host.messages
      .map((m) => {
        if (m.type !== MESSAGE_TYPE.WORKFLOW_LIST) return m;
        const workflows = m.content.workflows.filter((w) => w.id !== workflow.id);
        if (workflows.length === 0) return null;
        return { ...m, content: { ...m.content, workflows } };
      })
      .filter((m): m is Message => m !== null);

    host.messages = [
      ...host.messages,
      ezerStatusMessage(`✅ **"${workflow.name}" has been removed.**`),
    ];
    void refreshSavedWorkflows(host);
  } catch {
    host.messages = [
      ...host.messages,
      ezerStatusMessage(`⚠️ **${userErrorMessages.workflowDeleteFailed}**`),
    ];
  }
}
