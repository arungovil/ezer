import { recordIcon } from "@src/icons/index.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.js";

export class RecordButton extends LitElement {
  @property({ type: Boolean, reflect: true }) disabled = false;

  static styles = styles;

  private handleClick = () => {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent("ez-start-recording", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.handleClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.handleClick);
  }

  render() {
    return html`
      <span class="icon">${recordIcon}</span>
      <span>Record New Workflow</span>
    `;
  }
}

customElements.define("record-button", RecordButton);
