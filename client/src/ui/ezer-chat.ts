import { css, html, LitElement } from "lit";
import { createRef, type Ref, ref } from "lit/directives/ref.js";
import { repeat } from "lit/directives/repeat.js";
import type { Message } from "../types.js";
import "./ezer-header.js";
import "./message-bubble.js";
import "./ezer-input.js";

export type WorkflowStatus = "idle" | "recording" | "compiling" | "replaying" | "paused";

export class EzerChat extends LitElement {
  static properties = {
    messages: { type: Array, state: true },
    workflowStatus: { type: String, state: true },
    compiledAst: { type: Object, state: true },
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

  declare messages: Message[];
  declare workflowStatus: WorkflowStatus;
  declare compiledAst: unknown;

  private messagesRef: Ref<HTMLDivElement> = createRef();

  constructor() {
    super();
    this.messages = [];
    this.workflowStatus = "idle";
    this.compiledAst = null;
  }

  protected override updated() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    const container = this.messagesRef.value;
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
          ? html`<div class="messages" ${ref(this.messagesRef)}>
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
