import "@src/components/record-button/index.js";
import { renderMarkdown } from "@src/utils/markdown.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./message-bubble-tab-switched.styles.js";

export class MessageBubbleTabSwitched extends LitElement {
  @property({ type: String }) content = "";

  static styles = styles;

  render() {
    return html`
      <div>${renderMarkdown(this.content)}</div>
      <div class="tab-switched-actions">
        <record-button></record-button>
      </div>
    `;
  }
}

customElements.define("message-bubble-tab-switched", MessageBubbleTabSwitched);
