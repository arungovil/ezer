import { virtualize } from "@lit-labs/virtualizer/virtualize.js";
import { helpPrompt } from "@src/shared/constants.js";
import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.js";
import type { ChatWindowHost, Message, RuntimeMessage } from "@src/shared/types.js";
import { MESSAGE_TYPE } from "@src/shared/types.js";
import {
  createCaptureTask,
  disarmCaptureMode,
  handleSelectionCaptured,
  loadCaptureConversationForActiveTab,
  syncCaptureMode,
} from "@src/sidepanel/capture/index.js";
import {
  appendNoteListMessage,
  appendReminderListMessage,
} from "@src/sidepanel/capture/task-handlers.js";
import type { QuickActionId } from "@src/sidepanel/components/chat-input/quick-actions.js";
import { toUserErrorMessage, userErrorMessages } from "@src/sidepanel/utils/user-message.js";
import { html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { ChatScrollController } from "./chat-scroll-controller.js";
import { createChatTask } from "./chat-task.js";
import { styles } from "./styles.js";
import "@src/sidepanel/components/chat-empty/index.js";
import "@src/sidepanel/components/chat-header/index.js";
import "@src/sidepanel/components/chat-input/index.js";
import "@src/sidepanel/components/message-bubble/index.js";

export class ChatWindow extends LitElement implements ChatWindowHost {
  @state() messages: Message[] = [];

  private readonly chatTask = createChatTask(this);
  private readonly captureTask = createCaptureTask(this);
  private readonly chatScroll = new ChatScrollController(this, () => this.messages.length);
  private conversationLoadGeneration = 0;

  private handleRuntimeMessage = (message: RuntimeMessage) => {
    if (message?.type === RUNTIME_MESSAGE_TYPE.TAB_SWITCHED) {
      void this.handleTabSwitched();
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
  };

  override connectedCallback() {
    super.connectedCallback();
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(this.handleRuntimeMessage);
    }
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

  private async handleTabSwitched() {
    this.chatTask.abort();
    this.captureTask.abort();
    this.messages = [];
    syncCaptureMode(this);
    await this.loadConversation({ replace: true });
  }

  private async loadConversation(options: { replace?: boolean } = {}) {
    const generation = ++this.conversationLoadGeneration;
    const replace = options.replace ?? false;

    try {
      const loaded = await loadCaptureConversationForActiveTab();
      if (generation !== this.conversationLoadGeneration) {
        return;
      }

      if (!replace && this.messages.length > 0) {
        return;
      }

      this.messages = loaded;
      this.chatScroll.anchorToEnd(loaded.length);
    } catch {
      if (generation !== this.conversationLoadGeneration) {
        return;
      }

      if (replace || this.messages.length === 0) {
        this.messages = [];
      }
    }
  }

  private handleQuickAction(e: CustomEvent<QuickActionId>) {
    switch (e.detail) {
      case "reminders":
        void appendReminderListMessage(this);
        return;
      case "notes":
        void appendNoteListMessage(this);
        return;
      case "help":
        this.chatScroll.pinToEnd();
        void this.processChatMessage(helpPrompt, MESSAGE_TYPE.QUICK_ACTION);
        return;
    }
  }

  private handleSend(e: CustomEvent<{ text: string }>) {
    const text = e.detail.text.trim();
    if (!text) return;

    this.chatScroll.pinToEnd();
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

      const errorMessage = toUserErrorMessage(error, userErrorMessages.chatFailed);
      this.applyChatReply(ezerMsgId, `⚠️ **${errorMessage}**`, messageType);
    }
  }

  private async processMessage(text: string) {
    await this.processChatMessage(text);
  }

  render() {
    return html`
      <chat-header></chat-header>
      ${
        this.messages.length
          ? html`<div
              class="messages"
              @unpinned=${() => this.chatScroll.handleUnpinned()}
            >
              ${virtualize({
                scroller: true,
                layout: this.chatScroll.layout,
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
        placeholder="What can I help you with?"
        @ez-send=${this.handleSend}
        @ez-quick-action=${this.handleQuickAction}
      ></chat-input>
    `;
  }
}

customElements.define("chat-window", ChatWindow);
