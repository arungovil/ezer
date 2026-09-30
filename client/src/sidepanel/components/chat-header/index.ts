import "@src/sidepanel/components/common/ez-button/index.ts";
import { slidersHorizontalIcon } from "@src/sidepanel/icons/sliders-horizontal.ts";
import { zapIcon } from "@src/sidepanel/icons/zap.ts";
import { html, LitElement } from "lit";
import { styles } from "./styles.ts";

export class ChatHeader extends LitElement {
  static styles = styles;

  private handleMenu() {
    this.dispatchEvent(
      new CustomEvent("ez-menu", {
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
        <ez-button variant="ghost" size="icon-md" @click=${this.handleMenu}>${slidersHorizontalIcon}</ez-button>
      </div>
    `;
  }
}

customElements.define("chat-header", ChatHeader);
