import { html, LitElement } from "lit";
import { styles } from "./styles.js";

export class ChatLoader extends LitElement {
  static styles = styles;

  render() {
    return html`
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    `;
  }
}

customElements.define("chat-loader", ChatLoader);
