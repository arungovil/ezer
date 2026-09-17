import { virtualize } from "@lit-labs/virtualizer/virtualize.js";
import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.js";
import { formatReplayFailure } from "@src/shared/replay-failure.js";
import type {
  ChatWindowHost,
  Message,
  PendingWorkflowSave,
  RuntimeMessage,
  WorkflowStatus,
} from "@src/shared/types.js";
import { MESSAGE_TYPE } from "@src/shared/types.js";
import {
  createCaptureTask,
  disarmCaptureMode,
  handleSelectionCaptured,
  loadCaptureConversationForActiveTab,
  syncCaptureMode,
} from "@src/sidepanel/capture/index.js";
import { tabSwitchedMessage } from "@src/sidepanel/workflow/messages-handler.js";
import {
  clearPendingEmptyPlaceholder,
  handleRecordingComplete,
  handleStartRecording,
  handleStopRecording,
} from "@src/sidepanel/workflow/recording-handlers.js";
import {
  finishReplay,
  handleReplay,
  handleReplayFailed,
} from "@src/sidepanel/workflow/replay-handlers.js";
import {
  clearPendingWorkflowSave,
  completeWorkflowSave,
  handleDeleteWorkflow,
  handlePlayWorkflow,
  handleSave,
  refreshSavedWorkflows,
} from "@src/sidepanel/workflow/workflow-handlers.js";
import { html, LitElement, type PropertyValues } from "lit";
import { query, state } from "lit/decorators.js";
import { createChatTask } from "./chat-task.js";
import { styles } from "./styles.js";
import "@src/sidepanel/components/chat-empty/index.js";
import "@src/sidepanel/components/chat-header/index.js";
import "@src/sidepanel/components/chat-input/index.js";
import "@src/sidepanel/components/message-bubble/index.js";

export class ChatWindow extends LitElement implements ChatWindowHost {
  @state() messages: Message[] = [];
  @state() savedWorkflows: ChatWindowHost["savedWorkflows"] = [];
  @state() workflowStatus: WorkflowStatus = "idle";

  @query(".messages") private messagesContainer?: HTMLDivElement;

  replayingMessageId: string | null = null;
  pendingEmptyMsgId: string | null = null;
  pendingReplayError: string | null = null;
  pendingWorkflowSave: PendingWorkflowSave | null = null;

  private readonly chatTask = createChatTask(this);
  private readonly captureTask = createCaptureTask(this);
  private conversationLoadGeneration = 0;

  private handleRuntimeMessage = (message: RuntimeMessage) => {
    if (message?.type === RUNTIME_MESSAGE_TYPE.TAB_SWITCHED) {
      this.handleTabSwitched();
      return;
    }
    if (message?.type === RUNTIME_MESSAGE_TYPE.SELECTION_CAPTURED && message.text) {
      void handleSelectionCaptured(
        this,
        this.captureTask,
        message.text,
        message.url,
        message.title,
      );
    }
    if (message?.type === RUNTIME_MESSAGE_TYPE.RECORDING_COMPLETE && message.actions) {
      handleRecordingComplete(this, message.actions);
    }
    if (message?.type === RUNTIME_MESSAGE_TYPE.REPLAY_FAILED) {
      handleReplayFailed(
        this,
        message.error ?? (message.failure ? formatReplayFailure(message.failure) : "Run failed."),
      );
    }
    if (message?.type === RUNTIME_MESSAGE_TYPE.REPLAY_COMPLETE) {
      finishReplay(this);
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(this.handleRuntimeMessage);
    }
    void refreshSavedWorkflows(this);
    void this.loadConversation();
    syncCaptureMode(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.removeListener(this.handleRuntimeMessage);
    }
    disarmCaptureMode();
  }

  static styles = styles;

  protected override updated(changedProperties: PropertyValues<this>) {
    this.scrollToBottom();
    if (changedProperties.has("workflowStatus")) {
      syncCaptureMode(this);
    }
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private resetChat() {
    this.chatTask.abort();
    this.captureTask.abort();
    this.messages = [];
    this.workflowStatus = "idle";
    this.pendingEmptyMsgId = null;
    this.pendingWorkflowSave = null;
    this.replayingMessageId = null;
    this.pendingReplayError = null;
    syncCaptureMode(this);
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
    syncCaptureMode(this);

    if (this.messages.length === 0) {
      void this.loadConversation();
      return;
    }

    const last = this.messages[this.messages.length - 1];
    if (last?.type === MESSAGE_TYPE.TAB_SWITCHED) return;

    this.messages = [...this.messages, tabSwitchedMessage()];
  }

  private async loadConversation() {
    const generation = ++this.conversationLoadGeneration;

    try {
      const loaded = await loadCaptureConversationForActiveTab();
      if (generation !== this.conversationLoadGeneration || this.messages.length > 0) {
        return;
      }

      if (loaded.length > 0) {
        this.messages = loaded;
      }
    } catch {
      // Degrade to the welcome screen when history cannot be loaded.
    }
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

  private applyChatReply(
    ezerMsgId: string,
    content: string,
    messageType: typeof MESSAGE_TYPE.TEXT | typeof MESSAGE_TYPE.QUICK_ACTION,
  ) {
    this.messages = this.messages.map((m) =>
      m.id === ezerMsgId && m.type === messageType ? { ...m, content, loading: false } : m,
    );
  }

  private async processChatMessage(
    text: string,
    messageType: typeof MESSAGE_TYPE.TEXT | typeof MESSAGE_TYPE.QUICK_ACTION = MESSAGE_TYPE.TEXT,
  ) {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      type: messageType,
      content: text,
    };
    const ezerMsgId = crypto.randomUUID();
    const pendingEzerMsg: Message = {
      id: ezerMsgId,
      role: "ezer",
      type: messageType,
      content: "",
      loading: true,
    };
    this.messages = [...this.messages, userMsg, pendingEzerMsg];

    try {
      void this.chatTask.run([text, ezerMsgId]);
      const result = await this.chatTask.taskComplete;
      this.applyChatReply(result.ezerMsgId, result.reply, messageType);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : "Something went wrong.";
      this.applyChatReply(ezerMsgId, errorMessage, messageType);
    }
  }

  private async processMessage(text: string) {
    await this.processChatMessage(text);
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
                    ></message-bubble>
                  </div>`,
              })}
            </div>`
          : html`<chat-empty></chat-empty>`
      }
      <chat-input
        .placeholder=${
          this.pendingWorkflowSave ? "Give your workflow a name…" : "What can I help you with?"
        }
        @ez-send=${this.handleSend}
      ></chat-input>
    `;
  }
}

customElements.define("chat-window", ChatWindow);
