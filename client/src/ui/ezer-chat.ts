import { virtualize } from "@lit-labs/virtualizer/virtualize.js";
import type { Message } from "@src/types.js";
import { css, html, LitElement } from "lit";
import { query, state } from "lit/decorators.js";
import "./ezer-header.js";
import "./message-bubble.js";
import "./ezer-input.js";

export type WorkflowStatus = "idle" | "recording" | "compiling" | "replaying" | "paused";

export class EzerChat extends LitElement {
  @state() private messages: Message[] = [];
  @state() private workflowStatus: WorkflowStatus = "idle";
  @state() private compiledAst: unknown = null;

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
    .empty {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: var(--ez-color-text-muted);
      font-size: var(--ez-font-size-md);
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
          : html`<div class="empty">How can Ezer help?</div>`
      }
      <ezer-input @ez-send=${this.handleSend}></ezer-input>
    `;
  }
}

customElements.define("ezer-chat", EzerChat);
