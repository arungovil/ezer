import { css, html, LitElement } from "lit";

export class EzerInput extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      height: 48px;
      padding: 0 var(--ez-space-md);
      border-top: 1px solid var(--ez-color-border);
    }
    p {
      margin: 0;
      color: var(--ez-color-text-muted);
      font-size: var(--ez-font-size-sm);
    }
  `;

  render() {
    return html`<p>Input area</p>`;
  }
}

customElements.define("ezer-input", EzerInput);
