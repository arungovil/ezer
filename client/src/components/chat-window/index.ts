import { virtualize } from "@lit-labs/virtualizer/virtualize.js";
import { defaultInfoReply, infoReplies } from "@src/constants.js";
import { formatReplayFailure } from "@src/replay/index.js";
import type {
  ChatWindowHost,
  Message,
  PendingWorkflowSave,
  RuntimeMessage,
  WorkflowStatus,
} from "@src/types.js";
import { MESSAGE_TYPE } from "@src/types.js";
import { html, LitElement } from "lit";
import { query, state } from "lit/decorators.js";
import { tabSwitchedMessage } from "./messages-handler.js";
import {
  clearPendingEmptyPlaceholder,
  handleRecordingComplete,
  handleStartRecording,
  handleStopRecording,
} from "./recording-handlers.js";
import { finishReplay, handleReplay, handleReplayFailed } from "./replay-handlers.js";
import { styles } from "./styles.js";
import {
  appendWorkflowListMessage,
  clearPendingWorkflowSave,
  completeWorkflowSave,
  handleDeleteWorkflow,
  handlePlayWorkflow,
  handleSave,
  handleSelectWorkflow,
  refreshSavedWorkflows,
} from "./workflow-handlers.js";
import "@src/components/chat-empty/index.js";
import "@src/components/chat-workflows/index.js";
import "@src/components/chat-header/index.js";
import "@src/components/chat-input/index.js";
import "@src/components/message-bubble/index.js";

export class ChatWindow extends LitElement implements ChatWindowHost {
  @state() messages: Message[] = [];
  @state() savedWorkflows: ChatWindowHost["savedWorkflows"] = [];
  @state() workflowStatus: WorkflowStatus = "idle";

  @query(".messages") private messagesContainer?: HTMLDivElement;

  replayingMessageId: string | null = null;
  pendingEmptyMsgId: string | null = null;
  pendingReplayError: string | null = null;
  pendingWorkflowSave: PendingWorkflowSave | null = null;

  private handleRuntimeMessage = (message: RuntimeMessage) => {
    if (message?.type === "TAB_SWITCHED") {
      this.handleTabSwitched();
      return;
    }
    if (message?.type === "RECORDING_COMPLETE" && message.actions) {
      handleRecordingComplete(this, message.actions);
    }
    if (message?.type === "REPLAY_FAILED") {
      handleReplayFailed(
        this,
        message.error ??
          (message.failure ? formatReplayFailure(message.failure) : "Replay failed."),
      );
    }
    if (message?.type === "REPLAY_COMPLETE") {
      finishReplay(this);
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(this.handleRuntimeMessage);
    }
    void refreshSavedWorkflows(this);
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
    void refreshSavedWorkflows(this);
  }

  private handleTabSwitched() {
    this.workflowStatus = "idle";
    this.replayingMessageId = null;
    clearPendingEmptyPlaceholder(this);
    clearPendingWorkflowSave(this);

    if (this.messages.length === 0) {
      void refreshSavedWorkflows(this);
      return;
    }

    const last = this.messages[this.messages.length - 1];
    if (last?.type === MESSAGE_TYPE.TAB_SWITCHED) return;

    this.messages = [...this.messages, tabSwitchedMessage()];
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
      void completeWorkflowSave(this, text);
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
        @ez-stop-recording=${() => handleStopRecording(this)}
        @ez-new-chat=${this.handleNewChat}
      ></chat-header>
      ${
        this.messages.length
          ? html`<div
              class="messages"
              @ez-replay=${(e: CustomEvent) => handleReplay(this, e)}
              @ez-save=${(e: CustomEvent) => handleSave(this, e)}
              @ez-start-recording=${() => handleStartRecording(this)}
              @ez-play-workflow=${(e: CustomEvent) => handlePlayWorkflow(this, e, () => this.resetChat())}
              @ez-delete-workflow=${(e: CustomEvent) => void handleDeleteWorkflow(this, e)}
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
            ? html`<chat-workflows
                .workflows=${this.savedWorkflows}
                @ez-start-recording=${() => handleStartRecording(this)}
                @ez-select-workflow=${(e: CustomEvent) => handleSelectWorkflow(this, e)}
                @ez-show-all-workflows=${() => void appendWorkflowListMessage(this)}
              ></chat-workflows>`
            : html`<chat-empty
                @ez-start-recording=${() => handleStartRecording(this)}
                @ez-select-info=${this.handleSelectInfo}
              ></chat-empty>`
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
