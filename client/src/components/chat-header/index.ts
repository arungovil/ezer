import "@src/components/common/ez-button/index.js";
import "@src/components/common/ez-badge/index.js";
import { houseIcon } from "@src/icons/house.js";
import { zapIcon } from "@src/icons/zap.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.js";

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
                <ez-badge variant="error">Recording</ez-badge>
                <ez-button variant="outline" size="sm" @click=${this.handleStop}>Stop</ez-button>
              `
            : this.workflowStatus === "replaying"
              ? html`<ez-badge variant="info">Replaying</ez-badge>`
              : html`<ez-button variant="ghost" size="icon-md" @click=${this.handleNewChat}>${houseIcon}</ez-button>
                  `
        }
      </div>
    `;
  }
}

customElements.define("chat-header", ChatHeader);
