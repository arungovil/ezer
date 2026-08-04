import { css, html, LitElement } from "lit";
import type { Message } from "../types.js";
import "./ezer-header.js";
import "./message-bubble.js";
import "./ezer-input.js";

export class EzerChat extends LitElement {
  static properties = {
    isRecording: { type: Boolean, state: true },
    isCompiling: { type: Boolean, state: true },
    compiledAst: { type: Object, state: true },
    executionStatus: { type: String, state: true },
  };

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

  messages: Message[] = [];
  isRecording = false;
  isCompiling = false;
  compiledAst = null;
  executionStatus = "";

  protected override updated() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    const container = this.shadowRoot?.querySelector(".messages");
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
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
    this.requestUpdate();

    const replyText = await this.callApi(text);

    const ezerMsg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      content: replyText,
    };
    this.messages = [...this.messages, ezerMsg];
    this.requestUpdate();
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
              ${this.messages.map(
                (m) =>
                  html`<message-bubble sender=${m.role} content=${m.content}></message-bubble>`,
              )}
            </div>`
          : html`<div class="empty">How can Ezer help?</div>`
      }
      <ezer-input @ez-send=${this.handleSend}></ezer-input>
    `;
  }
}

customElements.define("ezer-chat", EzerChat);
