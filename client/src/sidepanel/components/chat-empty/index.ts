import "@src/sidepanel/components/common/ez-pill/index.js";
import "@src/sidepanel/components/record-button/index.js";
import { helpCircleIcon } from "@src/sidepanel/icons/index.js";
import { html, LitElement } from "lit";
import { styles } from "./styles.js";

export class ChatEmpty extends LitElement {
  static styles = styles;

  private handleHelpClick() {
    this.dispatchEvent(
      new CustomEvent("ez-help", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="hero">
        <h2>Say hello to ezer! 👋</h2>
        <p>Highlight text on the page or tap Help to get started</p>
      </div>

      <div class="pills-container">
        <record-button></record-button>

        <ez-pill
          variant="default"
          .icon=${helpCircleIcon}
          label="Help"
          @click=${this.handleHelpClick}
        ></ez-pill>
      </div>
    `;
  }
}

customElements.define("chat-empty", ChatEmpty);
