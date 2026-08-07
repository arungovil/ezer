import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./message-bubble.styles.js";
import "@src/components/chat-loader/chat-loader.js";

export class MessageBubble extends LitElement {
  @property({ type: String, reflect: true }) sender: "user" | "ezer" = "ezer";
  @property({ type: String }) content = "";
  @property({ type: Boolean }) loading = false;

  static styles = styles;

  render() {
    return html`
      <div class="sender-label">${this.sender === "user" ? "You" : "Ezer"}</div>
      <div class="bubble">${this.loading ? html`<chat-loader></chat-loader>` : this.content}</div>
    `;
  }
}

customElements.define("message-bubble", MessageBubble);
