import "@src/components/common/ez-pill/index.js";
import "@src/components/record-button/index.js";
import { infoPills } from "@src/constants.js";
import type { InfoPill } from "@src/types.js";
import { html, LitElement } from "lit";
import { styles } from "./styles.js";

export class ChatEmpty extends LitElement {
  static styles = styles;

  private handleInfoPillClick(pill: InfoPill) {
    this.dispatchEvent(
      new CustomEvent("ez-select-info", {
        detail: { id: pill.id, prompt: pill.prompt },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="hero">
        <h2>Say hello to ezer! 👋</h2>
        <p>Start recording a workflow or select a prompt to get started</p>
      </div>

      <div class="pills-container">
        <record-button></record-button>

        ${infoPills.map(
          (pill) => html`
            <ez-pill
              variant="default"
              .icon=${pill.icon}
              .label=${pill.label}
              @click=${() => this.handleInfoPillClick(pill)}
            ></ez-pill>
          `,
        )}
      </div>
    `;
  }
}

customElements.define("chat-empty", ChatEmpty);
