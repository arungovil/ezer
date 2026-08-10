import "@src/components/record-button/index.js";
import { renderMarkdown } from "@src/utils/markdown.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";

export class MessageBubbleQuickAction extends LitElement {
  @property({ type: String, reflect: true }) sender: "user" | "ezer" = "ezer";
  @property({ type: String }) content = "";
  @property({ type: Boolean }) recording = false;

  render() {
    return html`
      <div>${renderMarkdown(this.content)}</div>
      ${
        this.sender === "ezer"
          ? html`
            <record-button
              ?disabled=${this.recording}
            ></record-button>
          `
          : null
      }
    `;
  }
}

customElements.define("message-bubble-quick-action", MessageBubbleQuickAction);
