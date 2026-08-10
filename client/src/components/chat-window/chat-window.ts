import { virtualize } from "@lit-labs/virtualizer/virtualize.js";
import {
  defaultInfoReply,
  infoReplies,
  recordingStartedMessage,
  workflowListIntro,
  workflowListUserPrompt,
} from "@src/constants.js";
import { deleteWorkflow, getWorkflowsByTabId, saveWorkflow } from "@src/db/store.js";
import { formatReplayFailure } from "@src/replay/index.js";
import type {
  Message,
  RecordedAction,
  RuntimeMessage,
  Workflow,
  WorkflowContent,
  WorkflowListContent,
  WorkflowStatus,
} from "@src/types.js";
import { MESSAGE_TYPE } from "@src/types.js";
import { html, LitElement } from "lit";
import { query, state } from "lit/decorators.js";
import { styles } from "./chat-window.styles.js";
import "@src/components/common/ez-button/index.js";
import "@src/components/common/ez-badge/index.js";
import "@src/components/common/ez-pill/index.js";
import "@src/components/chat-splash/chat-splash.js";
import "@src/components/chat-splash/chat-splash-returning.js";
import "@src/components/chat-header/chat-header.js";
import "@src/components/chat-input/chat-input.js";
import "@src/components/message-bubble/index.js";

export class ChatWindow extends LitElement {
  @state() private messages: Message[] = [];
  @state() private savedWorkflows: Workflow[] = [];
  @state() protected workflowStatus: WorkflowStatus = "idle";

  @query(".messages") private messagesContainer?: HTMLDivElement;

  private replayingMessageId: string | null = null;
  private pendingEmptyMsgId: string | null = null;
  private pendingReplayError: string | null = null;
  private pendingWorkflowSave: { messageId: string; actions: RecordedAction[] } | null = null;

  private handleRuntimeMessage = (message: RuntimeMessage) => {
    if (message?.type === "TAB_SWITCHED") {
      this.handleTabSwitched();
      return;
    }
    if (message?.type === "RECORDING_COMPLETE" && message.actions) {
      this.handleRecordingComplete(message.actions);
    }
    if (message?.type === "REPLAY_FAILED") {
      this.pendingReplayError =
        message.error ??
        (message.failure ? formatReplayFailure(message.failure) : "Replay failed.");
    }
    if (message?.type === "REPLAY_COMPLETE") {
      this.finishReplay();
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(this.handleRuntimeMessage);
    }
    void this.refreshSavedWorkflows();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.removeListener(this.handleRuntimeMessage);
    }
  }

  static styles = styles;

  protected override updated() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private handleStartRecording() {
    this.workflowStatus = "recording";

    const msg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.RECORDING,
      content: recordingStartedMessage,
    };
    this.messages = [...this.messages, msg];

    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;

    chrome.runtime
      .sendMessage({
        target: "content",
        payload: { type: "START_RECORDING" },
      })
      .then((response: { error?: string }) => {
        if (response?.error) {
          this.workflowStatus = "idle";
          this.messages = this.messages.map((m) =>
            m.id === msg.id
              ? ({
                  ...m,
                  content:
                    "⚠️ **Could not start recording.** This page doesn't support automation (e.g., Chrome internal pages).",
                } as Message)
              : m,
          );
        }
      })
      .catch(() => {
        this.workflowStatus = "idle";
        this.messages = this.messages.map((m) =>
          m.id === msg.id
            ? ({
                ...m,
                content:
                  "⚠️ **Recording interrupted.** An unexpected error occurred. Please try again.",
              } as Message)
            : m,
        );
      });
  }

  private clearPendingEmptyPlaceholder() {
    if (!this.pendingEmptyMsgId) return;
    this.messages = this.messages.filter((m) => m.id !== this.pendingEmptyMsgId);
    this.pendingEmptyMsgId = null;
  }

  private handleStopRecording() {
    // Always show a stopping acknowledgment immediately, before the async
    // round-trip. If zero actions arrive we keep this placeholder; if actions
    // arrive we remove it and append the workflow card.
    const stoppingMsgId = crypto.randomUUID();
    const stoppingMsg: Message = {
      id: stoppingMsgId,
      role: "ezer",
      type: MESSAGE_TYPE.RECORDING,
      content: "⏹️ **Recording stopped.** No actions were captured.",
    };

    // Keep a reference so handleRecordingComplete can find and remove this
    // placeholder if real actions arrive.
    this.pendingEmptyMsgId = stoppingMsgId;
    this.messages = [...this.messages, stoppingMsg];
    this.workflowStatus = "idle";

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        target: "content",
        payload: { type: "STOP_RECORDING" },
      });
    }
  }

  private resetChat() {
    this.messages = [];
    this.workflowStatus = "idle";
    this.pendingEmptyMsgId = null;
    this.pendingWorkflowSave = null;
    this.replayingMessageId = null;
    this.pendingReplayError = null;
  }

  private handleNewChat() {
    this.resetChat();
    void this.refreshSavedWorkflows();
  }

  private handleTabSwitched() {
    this.workflowStatus = "idle";
    this.replayingMessageId = null;
    this.clearPendingEmptyPlaceholder();
    this.clearPendingWorkflowSave();

    if (this.messages.length === 0) {
      void this.refreshSavedWorkflows();
      return;
    }

    // Don't stack duplicate tab-switched messages
    const last = this.messages[this.messages.length - 1];
    if (last?.type === MESSAGE_TYPE.TAB_SWITCHED) return;

    const msg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.TAB_SWITCHED,
      content: "🔄 **Tab switched.** Start a new recording on this tab when you're ready.",
    };
    this.messages = [...this.messages, msg];
  }

  private handleRecordingComplete(actions: RecordedAction[]) {
    // If we already showed the empty placeholder (added eagerly in
    // handleStopRecording), remove it only when real actions arrived.
    if (this.pendingEmptyMsgId) {
      if (actions.length === 0) {
        // The placeholder is correct — nothing to change.
        this.pendingEmptyMsgId = null;
        return;
      }
      // Real actions came in: remove the placeholder before appending
      // the workflow card.
      this.messages = this.messages.filter((m) => m.id !== this.pendingEmptyMsgId);
      this.pendingEmptyMsgId = null;
    } else {
      // No placeholder was shown (edge case: recording stopped via tab
      // switch or other external trigger). Show the empty state now.
      if (actions.length === 0) {
        const msg: Message = {
          id: crypto.randomUUID(),
          role: "ezer",
          type: MESSAGE_TYPE.RECORDING,
          content: "⏹️ **Recording stopped.** No actions were captured.",
        };
        this.messages = [...this.messages, msg];
        return;
      }
    }

    void this.appendWorkflowMessage(actions);
  }

  private appendWorkflowMessage(actions: RecordedAction[]) {
    const lines = actions.map((action, i) => {
      const primarySelector = action.selectors[0] || action.tagName;
      const valueDetail = action.value !== undefined ? ` (value: "${action.value}")` : "";
      const textDetail = action.innerText && !action.value ? ` ("${action.innerText}")` : "";
      return `${i + 1}. \`${action.type}\` on \`${primarySelector}\`${valueDetail}${textDetail}`;
    });

    const textContent = `⏹️ **Recording stopped.** ${actions.length} action${actions.length > 1 ? "s" : ""} captured:\n\n${lines.join("\n")}`;

    const msg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.WORKFLOW,
      content: {
        text: textContent,
        actions,
        replaying: false,
        saved: false,
      } satisfies WorkflowContent,
    };
    this.messages = [...this.messages, msg];
  }

  private clearPendingWorkflowSave() {
    if (!this.pendingWorkflowSave) return;

    const { messageId } = this.pendingWorkflowSave;
    this.pendingWorkflowSave = null;
    this.messages = this.messages.map((m) => {
      if (m.id !== messageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
      return { ...m, content: { ...m.content, awaitingName: false } };
    });
  }

  private handleSave(e: CustomEvent<{ actions: RecordedAction[] }>) {
    const { actions } = e.detail;

    const message = this.messages.find(
      (m): m is Extract<Message, { type: typeof MESSAGE_TYPE.WORKFLOW }> =>
        m.type === MESSAGE_TYPE.WORKFLOW && m.content.actions === actions,
    );
    if (!message || message.content.saved || message.content.awaitingName) return;
    if (this.pendingWorkflowSave) return;

    this.pendingWorkflowSave = { messageId: message.id, actions };

    this.messages = this.messages.map((m) => {
      if (m.id !== message.id || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
      return { ...m, content: { ...m.content, awaitingName: true } };
    });

    const promptMsg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.RECORDING,
      content: "💾 **Name this workflow.** Reply with a title to save it.",
    };
    this.messages = [...this.messages, promptMsg];
  }

  private async completeWorkflowSave(name: string) {
    const pending = this.pendingWorkflowSave;
    if (!pending) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      type: MESSAGE_TYPE.TEXT,
      content: name,
    };
    this.messages = [...this.messages, userMsg];
    this.pendingWorkflowSave = null;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        this.messages = this.messages.map((m) => {
          if (m.id !== pending.messageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
          return { ...m, content: { ...m.content, awaitingName: false } };
        });
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "ezer",
          type: MESSAGE_TYPE.RECORDING,
          content: "⚠️ **Could not save workflow.** No active tab found.",
        };
        this.messages = [...this.messages, errorMsg];
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

      this.messages = this.messages.map((m) => {
        if (m.id !== pending.messageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
        return { ...m, content: { ...m.content, saved: true, awaitingName: false } };
      });

      const confirmMsg: Message = {
        id: crypto.randomUUID(),
        role: "ezer",
        type: MESSAGE_TYPE.RECORDING,
        content: `✅ **Workflow saved as "${name}"!**`,
      };
      this.messages = [...this.messages, confirmMsg];
      void this.refreshSavedWorkflows();
    } catch (err) {
      this.messages = this.messages.map((m) => {
        if (m.id !== pending.messageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
        return { ...m, content: { ...m.content, awaitingName: false } };
      });
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "ezer",
        type: MESSAGE_TYPE.RECORDING,
        content: `⚠️ **Failed to save workflow.** ${err instanceof Error ? err.message : "Unknown error"}`,
      };
      this.messages = [...this.messages, errorMsg];
    }
  }

  private beginReplay(messageId: string, actions: RecordedAction[]) {
    this.replayingMessageId = messageId;
    this.workflowStatus = "replaying";
    this.pendingReplayError = null;

    this.messages = this.messages.map((m) => {
      if (m.id !== messageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
      return { ...m, content: { ...m.content, replaying: true } };
    });

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        target: "content",
        payload: { type: "REPLAY_ACTIONS", actions },
      });
    }
  }

  private handleReplay(e: CustomEvent<{ actions: RecordedAction[] }>) {
    const { actions } = e.detail;

    const message = this.messages.find(
      (m): m is Extract<Message, { type: typeof MESSAGE_TYPE.WORKFLOW }> =>
        m.type === MESSAGE_TYPE.WORKFLOW && m.content.actions === actions,
    );
    if (!message) return;

    this.beginReplay(message.id, actions);
  }

  private finishReplay() {
    if (!this.replayingMessageId) return;

    this.messages = this.messages.map((m) => {
      if (m.id !== this.replayingMessageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
      return { ...m, content: { ...m.content, replaying: false } };
    });

    if (this.pendingReplayError) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "ezer",
        type: MESSAGE_TYPE.RECORDING,
        content: this.pendingReplayError,
      };
      this.messages = [...this.messages, errorMsg];
      this.pendingReplayError = null;
    } else {
      const successMsg: Message = {
        id: crypto.randomUUID(),
        role: "ezer",
        type: MESSAGE_TYPE.RECORDING,
        content: "✅ **Workflow run completed successfully.**",
      };
      this.messages = [...this.messages, successMsg];
    }

    this.replayingMessageId = null;
    this.workflowStatus = "idle";
  }

  private async refreshSavedWorkflows() {
    if (typeof chrome === "undefined" || !chrome.tabs?.query) {
      this.savedWorkflows = [];
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        this.savedWorkflows = [];
        return;
      }

      const workflows = await getWorkflowsByTabId(tab.id);
      this.savedWorkflows = workflows.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      this.savedWorkflows = [];
    }
  }

  private handleSelectWorkflow(e: CustomEvent<{ workflow: Workflow }>) {
    this.startWorkflowReplay(e.detail.workflow);
  }

  private async appendWorkflowListMessage() {
    await this.refreshSavedWorkflows();

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      type: MESSAGE_TYPE.TEXT,
      content: workflowListUserPrompt,
    };

    const introMsg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.RECORDING,
      content: workflowListIntro(this.savedWorkflows.length),
    };

    const newMessages: Message[] = [userMsg, introMsg];

    if (this.savedWorkflows.length > 0) {
      newMessages.push({
        id: crypto.randomUUID(),
        role: "ezer",
        type: MESSAGE_TYPE.WORKFLOW_LIST,
        content: {
          workflows: this.savedWorkflows,
        } satisfies WorkflowListContent,
      });
    }

    this.messages = [...this.messages, ...newMessages];
  }

  private startWorkflowReplay(workflow: Workflow) {
    if (workflow.actions.length === 0) return;

    const textContent = `▶ **${workflow.name}** — ${workflow.actions.length} action${workflow.actions.length === 1 ? "" : "s"}`;

    const msg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.WORKFLOW,
      content: {
        text: textContent,
        actions: workflow.actions,
        replaying: false,
        saved: true,
      } satisfies WorkflowContent,
    };
    this.messages = [...this.messages, msg];
    this.beginReplay(msg.id, workflow.actions);
  }

  private handlePlayWorkflow(e: CustomEvent<{ workflow: Workflow }>) {
    const { workflow } = e.detail;
    if (workflow.actions.length === 0) return;

    this.resetChat();
    this.startWorkflowReplay(workflow);
  }

  private async handleDeleteWorkflow(e: CustomEvent<{ workflow: Workflow }>) {
    const { workflow } = e.detail;

    try {
      await deleteWorkflow(workflow.id);

      this.messages = this.messages
        .map((m) => {
          if (m.type !== MESSAGE_TYPE.WORKFLOW_LIST) return m;
          const workflows = m.content.workflows.filter((w) => w.id !== workflow.id);
          if (workflows.length === 0) return null;
          return { ...m, content: { ...m.content, workflows } };
        })
        .filter((m): m is Message => m !== null);

      const confirmMsg: Message = {
        id: crypto.randomUUID(),
        role: "ezer",
        type: MESSAGE_TYPE.RECORDING,
        content: `✅ **"${workflow.name}" deleted.**`,
      };
      this.messages = [...this.messages, confirmMsg];
      void this.refreshSavedWorkflows();
    } catch (err) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "ezer",
        type: MESSAGE_TYPE.RECORDING,
        content: `⚠️ **Failed to delete workflow.** ${err instanceof Error ? err.message : "Unknown error"}`,
      };
      this.messages = [...this.messages, errorMsg];
    }
  }

  private handleSelectInfo(e: CustomEvent<{ id: string; prompt: string }>) {
    const { id, prompt } = e.detail;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      type: MESSAGE_TYPE.QUICK_ACTION,
      content: prompt,
    };

    const reply = infoReplies[id] ?? defaultInfoReply;

    const ezerMsg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.QUICK_ACTION,
      content: reply,
    };

    this.messages = [...this.messages, userMsg, ezerMsg];
  }

  private handleSend(e: CustomEvent<{ text: string }>) {
    const text = e.detail.text.trim();
    if (!text) return;

    if (this.pendingWorkflowSave) {
      void this.completeWorkflowSave(text);
      return;
    }

    void this.processMessage(text);
  }

  private async processMessage(text: string) {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      type: MESSAGE_TYPE.TEXT,
      content: text,
    };
    const ezerMsgId = crypto.randomUUID();
    const pendingEzerMsg: Message = {
      id: ezerMsgId,
      role: "ezer",
      type: MESSAGE_TYPE.TEXT,
      content: "",
      loading: true,
    };
    this.messages = [...this.messages, userMsg, pendingEzerMsg];

    const replyText = await this.callApi(text);

    this.messages = this.messages.map((m) =>
      m.id === ezerMsgId && m.type === MESSAGE_TYPE.TEXT
        ? { ...m, content: replyText, loading: false }
        : m,
    );
  }

  // TODO: wire to actual backend
  private async callApi(_text: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 800));
    return "Hang tight. We are working on getting the live interaction ready!";
  }

  render() {
    return html`
      <chat-header
        .workflowStatus=${this.workflowStatus}
        @ez-stop-recording=${this.handleStopRecording}
        @ez-new-chat=${this.handleNewChat}
      ></chat-header>
      ${
        this.messages.length
          ? html`<div
              class="messages"
              @ez-replay=${this.handleReplay}
              @ez-save=${this.handleSave}
              @ez-start-recording=${this.handleStartRecording}
              @ez-play-workflow=${this.handlePlayWorkflow}
              @ez-delete-workflow=${this.handleDeleteWorkflow}
            >
              ${virtualize({
                scroller: true,
                items: this.messages,
                keyFunction: (m: Message) => m.id,
                renderItem: (m: Message) =>
                  html`<div class="message-wrapper" data-message-id=${m.id}>
                    <message-bubble
                      .type=${m.type}
                      sender=${m.role}
                      .content=${m.content}
                      .loading=${m.loading ?? false}
                      .recording=${this.workflowStatus === "recording"}
                    ></message-bubble>
                  </div>`,
              })}
            </div>`
          : this.savedWorkflows.length > 0
            ? html`<chat-splash-returning
                .workflows=${this.savedWorkflows}
                @ez-start-recording=${this.handleStartRecording}
                @ez-select-workflow=${this.handleSelectWorkflow}
                @ez-show-all-workflows=${() => void this.appendWorkflowListMessage()}
              ></chat-splash-returning>`
            : html`<chat-splash
                @ez-start-recording=${this.handleStartRecording}
                @ez-select-info=${this.handleSelectInfo}
              ></chat-splash>`
      }
      <chat-input
        .placeholder=${
          this.pendingWorkflowSave ? "Enter a workflow name…" : "What are my available workflows?"
        }
        @ez-send=${this.handleSend}
      ></chat-input>
    `;
  }
}

customElements.define("chat-window", ChatWindow);
