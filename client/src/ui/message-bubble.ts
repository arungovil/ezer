import { css, html, LitElement } from "lit";

export class MessageBubble extends LitElement {
  static properties = {
    sender: { type: String, reflect: true },
    content: { type: String },
  };

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

  declare sender: "user" | "ezer";
  declare content: string;

  constructor() {
    super();
    this.sender = "ezer";
    this.content = "";
  }

  render() {
    return html`
      <div class="sender-label">${this.sender === "user" ? "You" : "Ezer"}</div>
      <div class="bubble">${this.content}</div>
    `;
  }
}

customElements.define("message-bubble", MessageBubble);
