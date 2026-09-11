import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.js";

export class EzPill extends LitElement {
  @property({ type: String, reflect: true }) variant: "primary" | "default" = "default";
  @property() icon: unknown = null;
  @property({ type: String }) label = "";

  static styles = styles;

  render() {
    return html`
      <span class="icon">${this.icon}</span>
      <span>${this.label}</span>
    `;
  }
}

customElements.define("ez-pill", EzPill);
