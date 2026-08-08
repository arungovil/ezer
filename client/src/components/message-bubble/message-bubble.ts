import type { RecordedAction } from "@src/types.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./message-bubble.styles.js";
import "@src/components/chat-loader/chat-loader.js";

export class MessageBubble extends LitElement {
  @property({ type: String, reflect: true }) sender: "user" | "ezer" = "ezer";
  @property({ type: String }) content = "";
  @property({ type: Boolean }) loading = false;
  @property({ type: Array }) actions: RecordedAction[] = [];
  @property({ type: Boolean }) replaying = false;

  static styles = styles;

  private handleReplay() {
    if (this.replaying || this.actions.length === 0) return;
    this.dispatchEvent(
      new CustomEvent("ez-replay", {
        detail: { actions: this.actions },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="sender-label">${this.sender === "user" ? "You" : "Ezer"}</div>
      <div class="bubble">
        ${this.loading ? html`<chat-loader></chat-loader>` : this.content}
        ${
          this.actions.length > 0
            ? html`
              <button
                class="replay-btn"
                ?disabled=${this.replaying}
                @click=${this.handleReplay}
              >
                ${this.replaying ? "⏳ Replaying…" : "▶ Replay"}
              </button>
            `
            : null
        }
      </div>
    `;
  }
}

customElements.define("message-bubble", MessageBubble);
