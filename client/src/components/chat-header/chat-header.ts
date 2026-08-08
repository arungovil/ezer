import { messageCirclePlusIcon } from "@src/icons/message-circle-plus.js";
import { textAlignStartIcon } from "@src/icons/text-align-start.js";
import { zapIcon } from "@src/icons/zap.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./chat-header.styles.js";

export class ChatHeader extends LitElement {
  @property({ type: String }) workflowStatus = "idle";

  static styles = styles;

  private handleStop() {
    this.dispatchEvent(
      new CustomEvent("ez-stop-recording", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleNewChat() {
    this.dispatchEvent(
      new CustomEvent("ez-new-chat", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="left">
        <div class="logo">${zapIcon}</div>
        <h1>Ezer</h1>
      </div>
      <div class="right">
        ${
          this.workflowStatus === "recording"
            ? html`
                <div class="recording-badge">
                  <span class="recording-dot"></span>
                  <span>Recording</span>
                </div>
                <button class="stop-btn" @click=${this.handleStop}>Stop</button>
              `
            : this.workflowStatus === "replaying"
              ? html`
                  <div class="replaying-badge">
                    <span class="replaying-dot"></span>
                    <span>Replaying</span>
                  </div>
                `
              : html`<button class="icon-btn" @click=${this.handleNewChat}>${messageCirclePlusIcon}</button>
                  <button class="icon-btn" @click=${() => {}}>${textAlignStartIcon}</button>`
        }
      </div>
    `;
  }
}

customElements.define("chat-header", ChatHeader);
