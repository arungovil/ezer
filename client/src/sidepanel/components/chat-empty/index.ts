import { html, LitElement } from "lit";
import { styles } from "./styles.ts";

export class ChatEmpty extends LitElement {
  static styles = styles;

  render() {
    return html`
      <div class="hero">
        <h2>Say hello to Ezer! 👋</h2>
        <p>Select text on this page to save a note or reminder.</p>
        <p>Type <kbd>/</kbd> below for more options.</p>
      </div>
    `;
  }
}

customElements.define("chat-empty", ChatEmpty);
