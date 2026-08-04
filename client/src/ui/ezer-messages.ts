import { css, html, LitElement } from "lit";

export class EzerMessages extends LitElement {
  static styles = css`
    :host {
      display: block;
      flex: 1;
      overflow-y: auto;
      padding: var(--ez-space-md);
    }
    p {
      margin: 0;
      color: var(--ez-color-text-muted);
      font-size: var(--ez-font-size-sm);
    }
  `;

  render() {
    return html`<p>Messages area</p>`;
  }
}

customElements.define("ezer-messages", EzerMessages);
