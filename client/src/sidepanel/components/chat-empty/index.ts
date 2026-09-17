import { html, LitElement } from "lit";
import { styles } from "./styles.js";

export class ChatEmpty extends LitElement {
  static styles = styles;

  render() {
    return html`
      <div class="hero">
        <h2>Say hello to Ezer! 👋</h2>
        <p>
          Highlight text on any page to save reminders and notes, or ask me anything below.
        </p>
      </div>
    `;
  }
}

customElements.define("chat-empty", ChatEmpty);
