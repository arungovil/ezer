import { textAlignStartIcon } from "@src/sidepanel/icons/index.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.js";

export class CaptureButton extends LitElement {
  @property({ type: Boolean, reflect: true }) disabled = false;

  static styles = styles;

  private handleClick = () => {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent("ez-start-capture", {
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
      <span class="icon">${textAlignStartIcon}</span>
      <span>Capture Highlight</span>
    `;
  }
}

customElements.define("capture-button", CaptureButton);
