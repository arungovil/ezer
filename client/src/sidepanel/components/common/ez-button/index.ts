import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.ts";

export class EzButton extends LitElement {
  @property({ type: String, reflect: true }) variant: "primary" | "outline" | "ghost" = "primary";
  @property({ type: String, reflect: true }) size: "sm" | "md" | "icon-sm" | "icon-md" = "md";
  @property({ type: Boolean, reflect: true }) disabled = false;

  static styles = styles;

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define("ez-button", EzButton);
