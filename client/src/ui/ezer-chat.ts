import { virtualize } from "@lit-labs/virtualizer/virtualize.js";
import { defaultInfoReply, infoReplies, recordingStartedMessage } from "@src/constants.js";
import type { Message } from "@src/types.js";
import { css, html, LitElement } from "lit";
import { query, state } from "lit/decorators.js";
import "./ezer-empty-state.js";
import "./ezer-header.js";
import "./ezer-input.js";
import "./message-bubble.js";

export type WorkflowStatus = "idle" | "recording" | "compiling" | "replaying" | "paused";

export class EzerChat extends LitElement {
  @state() private messages: Message[] = [];
  @state() protected workflowStatus: WorkflowStatus = "idle";

  @query(".messages") private messagesContainer?: HTMLDivElement;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--ez-color-bg);
    }
    .messages {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-gutter: stable;
      padding: var(--ez-space-md) 0;
      box-sizing: border-box;
    }
  `;

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
    const ezerMsg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      content: recordingStartedMessage,
    };
    this.messages = [...this.messages, ezerMsg];
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
      <ezer-header></ezer-header>
      ${
        this.messages.length
          ? html`<div class="messages">
              ${virtualize({
                scroller: true,
                items: this.messages,
                keyFunction: (m: Message) => m.id,
                renderItem: (m: Message) =>
                  html`<message-bubble
                    .sender=${m.role}
                    .content=${m.content}
                    .loading=${m.loading ?? false}
                  ></message-bubble>`,
              })}
            </div>`
          : html`<ezer-empty-state
              @ez-start-recording=${this.handleStartRecording}
              @ez-select-info=${this.handleSelectInfo}
            ></ezer-empty-state>`
      }
      <ezer-input @ez-send=${this.handleSend}></ezer-input>
    `;
  }
}

customElements.define("ezer-chat", EzerChat);
