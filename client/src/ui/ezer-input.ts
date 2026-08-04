import { sendIcon } from "@src/icons/send.js";
import { css, html, LitElement } from "lit";
import { query } from "lit/decorators.js";

export class EzerInput extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--ez-space-sm);
      flex-shrink: 0;
      padding: var(--ez-space-sm) var(--ez-space-md);
      border-top: 1px solid var(--ez-color-border);
    }
    textarea {
      flex: 1;
      resize: none;
      padding: var(--ez-space-sm);
      border: none;
      border-radius: var(--ez-radius-sm);
      font-family: var(--ez-font-sans);
      font-size: var(--ez-font-size-md);
      line-height: var(--ez-line-height);
      color: var(--ez-color-text);
      background: var(--ez-color-surface);
      outline: none;
      /* single-line baseline, synced with font-size + line-height + padding */
      height: 40px;
      max-height: 128px;
    }
    button {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--ez-space-sm);
      border: none;
      border-radius: var(--ez-radius-sm);
      background: var(--ez-color-primary);
      color: var(--ez-color-primary-text);
      cursor: pointer;
    }
    button svg {
      display: block;
      width: 18px;
      height: 18px;
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
  `;

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
        aria-label="Ask anything to Ezer"
        placeholder="Ask anything to Ezer..."
        @focus=${this.handleFocus}
        @input=${this.handleInput}
        @keydown=${this.handleKeydown}
      ></textarea>
      <button @click=${this.handleSend}>${sendIcon}</button>
    `;
  }
}

customElements.define("ezer-input", EzerInput);
