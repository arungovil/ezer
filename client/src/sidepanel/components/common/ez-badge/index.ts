import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.ts";

export class EzBadge extends LitElement {
  @property({ type: String, reflect: true }) variant: "error" | "info" = "info";

  static styles = styles;

  render() {
    return html`<span class="dot"></span><slot></slot>`;
  }
}

customElements.define("ez-badge", EzBadge);
