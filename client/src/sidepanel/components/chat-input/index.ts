import "@src/sidepanel/components/common/ez-button/index.js";
import { sendIcon } from "@src/sidepanel/icons/send.js";
import { html, LitElement } from "lit";
import { property, query } from "lit/decorators.js";
import { styles } from "./styles.js";

export class ChatInput extends LitElement {
  @property({ type: String }) placeholder = "What can I help you with?";

  static styles = styles;

  @query("textarea") private textareaEl?: HTMLTextAreaElement;

  private singleLineHeight = 0;

  private handleSend() {
    const el = this.textareaEl;
    if (!el?.value.trim()) return;
    this.dispatchEvent(
      new CustomEvent("ez-send", {
        detail: { text: el.value },
        bubbles: true,
        composed: true,
      }),
    );
    el.value = "";
    el.style.height = "";
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }

  protected override firstUpdated() {
    this.textareaEl?.focus();
  }

  private handleFocus(e: FocusEvent) {
    const el = e.target as HTMLTextAreaElement;
    if (!this.singleLineHeight) {
      this.singleLineHeight = el.scrollHeight;
    }
  }

  private handleInput(e: InputEvent) {
    const el = e.target as HTMLTextAreaElement;
    if (!this.singleLineHeight) this.singleLineHeight = el.scrollHeight;
    el.style.height = "0";
    if (el.scrollHeight > this.singleLineHeight) {
      el.style.height = `${el.scrollHeight}px`;
    } else {
      el.style.height = "";
    }
  }

  render() {
    return html`
      <textarea
        aria-label=${this.placeholder}
        placeholder=${this.placeholder}
        @focus=${this.handleFocus}
        @input=${this.handleInput}
        @keydown=${this.handleKeydown}
      ></textarea>
      <ez-button variant="primary" size="icon-md" @click=${this.handleSend}>${sendIcon}</ez-button>
    `;
  }
}

customElements.define("chat-input", ChatInput);
