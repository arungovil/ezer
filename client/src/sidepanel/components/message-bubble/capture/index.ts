import type { CaptureContent } from "@src/shared/types.ts";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.ts";

export class MessageBubbleCapture extends LitElement {
  @property({ type: Object }) content: CaptureContent = { text: "" };

  static styles = styles;

  render() {
    return html`
      <div class="capture-text">${this.content.text}</div>
      ${
        this.content.url
          ? html`<a
            class="capture-source"
            href=${this.content.url}
            target="_blank"
            rel="noopener noreferrer"
            >${this.content.title || this.content.url}</a
          >`
          : ""
      }
    `;
  }
}

customElements.define("message-bubble-capture", MessageBubbleCapture);
