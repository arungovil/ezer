import { virtualize } from "@lit-labs/virtualizer/virtualize.js";
import { defaultInfoReply, infoReplies, recordingStartedMessage } from "@src/constants.js";
import type { Message, RecordedAction, RuntimeMessage, WorkflowStatus } from "@src/types.js";
import { html, LitElement } from "lit";
import { query, state } from "lit/decorators.js";
import { styles } from "./chat-window.styles.js";
import "@src/components/chat-splash/chat-splash.js";
import "@src/components/chat-header/chat-header.js";
import "@src/components/chat-input/chat-input.js";
import "@src/components/message-bubble/message-bubble.js";

export class ChatWindow extends LitElement {
  @state() private messages: Message[] = [];
  @state() protected workflowStatus: WorkflowStatus = "idle";

  @query(".messages") private messagesContainer?: HTMLDivElement;

  private replayingMessageId: string | null = null;

  private handleRuntimeMessage = (message: RuntimeMessage) => {
    if (message?.type === "RECORDING_COMPLETE" && message.actions) {
      this.handleRecordingComplete(message.actions);
    }
    if (message?.type === "REPLAY_COMPLETE") {
      this.finishReplay();
    }
    if (message?.type === "REPLAY_ERROR") {
      this.finishReplay();
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(this.handleRuntimeMessage);
    }
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

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        target: "content",
        payload: { type: "START_RECORDING" },
      });
    }

    const ezerMsg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      content: recordingStartedMessage,
    };
    this.messages = [...this.messages, ezerMsg];
  }

  private handleStopRecording() {
    this.workflowStatus = "idle";

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        target: "content",
        payload: { type: "STOP_RECORDING" },
      });
    }
  }

  private handleNewChat() {
    this.messages = [];
    this.workflowStatus = "idle";
  }

  private handleRecordingComplete(actions: RecordedAction[]) {
    if (actions.length === 0) {
      const msg: Message = {
        id: crypto.randomUUID(),
        role: "ezer",
        content: "⏹️ **Recording stopped.** No actions were captured.",
      };
      this.messages = [...this.messages, msg];
      return;
    }

    const lines = actions.map((action, i) => {
      const primarySelector = action.selectors[0] || action.tagName;
      const valueDetail = action.value !== undefined ? ` (value: "${action.value}")` : "";
      const textDetail = action.innerText && !action.value ? ` ("${action.innerText}")` : "";
      return `${i + 1}. \`${action.type}\` on \`${primarySelector}\`${valueDetail}${textDetail}`;
    });

    const content = `⏹️ **Recording stopped.** ${actions.length} action${actions.length > 1 ? "s" : ""} captured:\n\n${lines.join("\n")}`;

    const msg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      content,
      actions,
      replaying: false,
    };
    this.messages = [...this.messages, msg];
  }

  private handleReplay(e: CustomEvent<{ actions: RecordedAction[] }>) {
    const { actions } = e.detail;

    // Match by reference — the actions array is the same object stored on the message
    const message = this.messages.find((m) => m.actions === actions);
    if (!message) return;

    this.replayingMessageId = message.id;
    this.workflowStatus = "replaying";

    this.messages = this.messages.map((m) => (m.id === message.id ? { ...m, replaying: true } : m));

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        target: "content",
        payload: { type: "REPLAY_ACTIONS", actions },
      });
    }
  }

  private finishReplay() {
    if (!this.replayingMessageId) return;

    this.messages = this.messages.map((m) =>
      m.id === this.replayingMessageId ? { ...m, replaying: false } : m,
    );
    this.replayingMessageId = null;
    this.workflowStatus = "idle";
  }

  private handleSelectInfo(e: CustomEvent<{ id: string; label: string }>) {
    const { id, label } = e.detail;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: label,
    };

    const reply = infoReplies[id] ?? defaultInfoReply;

    const ezerMsg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      content: reply,
    };

    this.messages = [...this.messages, userMsg, ezerMsg];
  }

  private handleSend(e: CustomEvent<{ text: string }>) {
    const text = e.detail.text.trim();
    if (!text) return;
    void this.processMessage(text);
  }

  private async processMessage(text: string) {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const ezerMsgId = crypto.randomUUID();
    const pendingEzerMsg: Message = {
      id: ezerMsgId,
      role: "ezer",
      content: "",
      loading: true,
    };
    this.messages = [...this.messages, userMsg, pendingEzerMsg];

    const replyText = await this.callApi(text);

    this.messages = this.messages.map((m) =>
      m.id === ezerMsgId ? { ...m, content: replyText, loading: false } : m,
    );
  }

  // TODO: wire to actual backend
  private async callApi(_text: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 800));
    return "Got it. I'll help with that — API wiring coming soon.";
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
          ? html`<div class="messages" @ez-replay=${this.handleReplay}>
              ${virtualize({
                scroller: true,
                items: this.messages,
                keyFunction: (m: Message) => m.id,
                renderItem: (m: Message) =>
                  html`<div data-message-id=${m.id}>
                    <message-bubble
                      .sender=${m.role}
                      .content=${m.content}
                      .loading=${m.loading ?? false}
                      .actions=${m.actions ?? []}
                      .replaying=${m.replaying ?? false}
                    ></message-bubble>
                  </div>`,
              })}
            </div>`
          : html`<chat-splash
              @ez-start-recording=${this.handleStartRecording}
              @ez-select-info=${this.handleSelectInfo}
            ></chat-splash>`
      }
      <chat-input @ez-send=${this.handleSend}></chat-input>
    `;
  }
}

customElements.define("chat-window", ChatWindow);
