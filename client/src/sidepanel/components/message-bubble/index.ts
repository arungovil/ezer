import type { CaptureContent, MessageType } from "@src/sidepanel/types.ts";
import { MESSAGE_TYPE } from "@src/sidepanel/types.ts";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.ts";
import "@src/sidepanel/components/chat-loader/index.ts";
import "@src/sidepanel/components/message-bubble/capture/index.ts";
import "@src/sidepanel/components/message-bubble/text/index.ts";
import "@src/sidepanel/components/message-bubble/quick-action/index.ts";
import "@src/sidepanel/components/message-bubble/status/index.ts";
import "@src/sidepanel/components/message-bubble/tab-switched/index.ts";

export class MessageBubble extends LitElement {
  @property({ type: String, reflect: true }) sender: "user" | "ezer" = "ezer";
  @property({ type: String }) type: MessageType = MESSAGE_TYPE.TEXT;
  @property() content: unknown = "";
  @property({ type: Boolean }) loading = false;

  static styles = styles;

  private renderContent() {
    switch (this.type) {
      case MESSAGE_TYPE.TEXT:
        return html`<message-bubble-text .content=${this.content as string}></message-bubble-text>`;
      case MESSAGE_TYPE.CAPTURE:
        return html`<message-bubble-capture
          .content=${this.content as CaptureContent}
        ></message-bubble-capture>`;
      case MESSAGE_TYPE.QUICK_ACTION:
        return html`<message-bubble-quick-action
          .content=${this.content as string}
        ></message-bubble-quick-action>`;
      case MESSAGE_TYPE.STATUS:
        return html`<message-bubble-status
          .content=${this.content as string}
        ></message-bubble-status>`;
      case MESSAGE_TYPE.TAB_SWITCHED:
        return html`<message-bubble-tab-switched
          .content=${this.content as string}
        ></message-bubble-tab-switched>`;
      default:
        return html`<message-bubble-text
          .content=${String(this.content)}
        ></message-bubble-text>`;
    }
  }

  render() {
    return html`
      <div class="sender-label">${this.sender === "user" ? "You" : "Ezer"}</div>
      <div class="bubble">
        ${this.loading ? html`<chat-loader></chat-loader>` : this.renderContent()}
      </div>
    `;
  }
}

customElements.define("message-bubble", MessageBubble);
