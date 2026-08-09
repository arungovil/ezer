import type { MessageType, WorkflowContent } from "@src/types.js";
import { MESSAGE_TYPE } from "@src/types.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.js";
import "./message-bubble-text.js";
import "./message-bubble-quick-action.js";
import "./message-bubble-recording.js";
import "./message-bubble-workflow.js";
import "@src/components/chat-loader/chat-loader.js";

export class MessageBubble extends LitElement {
  @property({ type: String, reflect: true }) sender: "user" | "ezer" = "ezer";
  @property({ type: String }) type: MessageType = MESSAGE_TYPE.TEXT;
  @property() content: unknown = "";
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) recording = false;

  static styles = styles;

  private renderContent() {
    switch (this.type) {
      case MESSAGE_TYPE.TEXT:
        return html`<message-bubble-text .content=${this.content as string}></message-bubble-text>`;
      case MESSAGE_TYPE.QUICK_ACTION:
        return html`<message-bubble-quick-action
          .sender=${this.sender}
          .content=${this.content as string}
          .recording=${this.recording}
        ></message-bubble-quick-action>`;
      case MESSAGE_TYPE.RECORDING:
        return html`<message-bubble-recording
          .content=${this.content as string}
        ></message-bubble-recording>`;
      case MESSAGE_TYPE.WORKFLOW:
        return html`<message-bubble-workflow
          .content=${this.content as WorkflowContent}
        ></message-bubble-workflow>`;
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
