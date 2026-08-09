import { renderMarkdown } from "@src/utils/markdown.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./message-bubble-quick-action.styles.js";

export class MessageBubbleQuickAction extends LitElement {
  @property({ type: String, reflect: true }) sender: "user" | "ezer" = "ezer";
  @property({ type: String }) content = "";
  @property({ type: Boolean }) recording = false;

  static styles = styles;

  private handleStartRecording() {
    if (this.recording) return;
    this.dispatchEvent(
      new CustomEvent("ez-start-recording", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div>${renderMarkdown(this.content)}</div>
      ${
        this.sender === "ezer"
          ? html`
            <button
              class="record-btn"
              ?disabled=${this.recording}
              @click=${this.handleStartRecording}
            >
              🔴 Start Recording
            </button>
          `
          : null
      }
    `;
  }
}

customElements.define("message-bubble-quick-action", MessageBubbleQuickAction);
