import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "./chat-loader.js";

export class MessageBubble extends LitElement {
  @property({ type: String, reflect: true }) sender: "user" | "ezer" = "ezer";
  @property({ type: String }) content = "";
  @property({ type: Boolean }) loading = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      max-width: 85%;
    }
    :host([sender="user"]) {
      align-self: flex-end;
    }
    :host([sender="ezer"]) {
      align-self: flex-start;
    }
    .sender-label {
      font-size: var(--ez-font-size-sm);
      font-weight: var(--ez-font-weight-medium);
      color: var(--ez-color-text-muted);
      margin-bottom: var(--ez-space-xs);
      padding: 0 var(--ez-space-xs);
    }
    .bubble {
      padding: var(--ez-space-sm) var(--ez-space-md);
      border-radius: var(--ez-radius-md);
      font-size: var(--ez-font-size-md);
      line-height: var(--ez-line-height);
    }
    :host([sender="user"]) .bubble {
      background: var(--ez-color-primary);
      color: var(--ez-color-primary-text);
    }
    :host([sender="ezer"]) .bubble {
      background: var(--ez-color-surface);
      color: var(--ez-color-text);
    }
  `;

  render() {
    return html`
      <div class="sender-label">${this.sender === "user" ? "You" : "Ezer"}</div>
      <div class="bubble">${this.loading ? html`<chat-loader></chat-loader>` : this.content}</div>
    `;
  }
}

customElements.define("message-bubble", MessageBubble);
