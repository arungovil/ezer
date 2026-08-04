import type { Message } from "@src/types.js";
import { css, html, LitElement } from "lit";
import { query, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
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
      gap: var(--ez-space-md);
      flex: 1;
      overflow-y: auto;
      padding: var(--ez-space-md);
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
    this.messages = [...this.messages, userMsg];

    const replyText = await this.callApi(text);

    const ezerMsg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      content: replyText,
    };
    this.messages = [...this.messages, ezerMsg];
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
              ${repeat(
                this.messages,
                (m) => m.id,
                (m) =>
                  html`<message-bubble .sender=${m.role} .content=${m.content}></message-bubble>`,
              )}
            </div>`
          : html`<div class="empty">How can Ezer help?</div>`
      }
      <ezer-input @ez-send=${this.handleSend}></ezer-input>
    `;
  }
}

customElements.define("ezer-chat", EzerChat);
