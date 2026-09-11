import { renderMarkdown } from "@src/sidepanel/utils/markdown.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";

export class MessageBubbleRecording extends LitElement {
  @property({ type: String }) content = "";

  render() {
    return html`${renderMarkdown(this.content)}`;
  }
}

customElements.define("message-bubble-recording", MessageBubbleRecording);
