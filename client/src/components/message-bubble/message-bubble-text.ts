import { renderMarkdown } from "@src/utils/markdown.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./message-bubble-text.styles.js";

export class MessageBubbleText extends LitElement {
  @property({ type: String }) content = "";

  static styles = styles;

  render() {
    return html`${renderMarkdown(this.content)}`;
  }
}

customElements.define("message-bubble-text", MessageBubbleText);
