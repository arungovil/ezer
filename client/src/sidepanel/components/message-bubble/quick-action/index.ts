import { renderMarkdown } from "@src/sidepanel/utils/markdown.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";

export class MessageBubbleQuickAction extends LitElement {
  @property({ type: String }) content = "";

  render() {
    return html`<div>${renderMarkdown(this.content)}</div>`;
  }
}

customElements.define("message-bubble-quick-action", MessageBubbleQuickAction);
