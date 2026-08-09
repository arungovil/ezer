import { infoPills } from "@src/constants.js";
import { recordIcon } from "@src/icons/index.js";
import type { InfoPill } from "@src/types.js";
import { html, LitElement } from "lit";
import { styles } from "./chat-splash.styles.js";

export class ChatSplash extends LitElement {
  static styles = styles;

  private handleStartRecording() {
    this.dispatchEvent(
      new CustomEvent("ez-start-recording", {
        bubbles: true,
        composed: true,
      }),
    );
  }

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
        <h2>Say hello to Ezer! 👋</h2>
        <p>Start recording a workflow or select a prompt to get started</p>
      </div>

      <div class="pills-container">
        <button class="pill record-pill" @click=${this.handleStartRecording}>
          <div class="pill-icon">${recordIcon}</div>
          <span>Record New Workflow</span>
        </button>

        ${infoPills.map(
          (pill) => html`
            <button
              class="pill info-pill"
              @click=${() => this.handleInfoPillClick(pill)}
            >
              <div class="pill-icon">${pill.icon}</div>
              <span>${pill.label}</span>
            </button>
          `,
        )}
      </div>

    `;
  }
}

customElements.define("chat-splash", ChatSplash);
