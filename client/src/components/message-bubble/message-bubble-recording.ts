import { renderMarkdown } from "@src/utils/markdown.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./message-bubble-recording.styles.js";

export class MessageBubbleRecording extends LitElement {
  @property({ type: String }) content = "";

  static styles = styles;

  render() {
    return html`${renderMarkdown(this.content)}`;
  }
}

customElements.define("message-bubble-recording", MessageBubbleRecording);
