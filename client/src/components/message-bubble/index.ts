import type { MessageType, WorkflowContent, WorkflowListContent } from "@src/types.js";
import { MESSAGE_TYPE } from "@src/types.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.js";
import "@src/components/chat-loader/index.js";
import "@src/components/message-bubble/text/index.js";
import "@src/components/message-bubble/quick-action/index.js";
import "@src/components/message-bubble/recording/index.js";
import "@src/components/message-bubble/workflow/index.js";
import "@src/components/message-bubble/workflow-list/index.js";
import "@src/components/message-bubble/tab-switched/index.js";

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
      case MESSAGE_TYPE.WORKFLOW_LIST:
        return html`<message-bubble-workflow-list
          .content=${this.content as WorkflowListContent}
        ></message-bubble-workflow-list>`;
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
