import { css, html, LitElement } from "lit";
import { gearIcon } from "../icons/gear.js";

export class EzerHeader extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      height: 48px;
      padding: 0 var(--ez-space-md);
      border-bottom: 1px solid var(--ez-color-border);
    }
    .left,
    .right {
      flex: 1;
      display: flex;
      align-items: center;
    }
    .right {
      justify-content: flex-end;
    }
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--ez-space-xs);
      border: none;
      border-radius: var(--ez-radius-sm);
      background: none;
      color: var(--ez-color-text-muted);
      cursor: pointer;
    }
    .icon-btn svg {
      display: block;
      width: 20px;
      height: 20px;
    }
    .logo {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--ez-color-primary);
      margin-right: var(--ez-space-sm);
      flex-shrink: 0;
    }
    h1 {
      font-size: var(--ez-font-size-md);
      font-weight: var(--ez-font-weight-semibold);
      margin: 0;
    }
  `;

  render() {
    return html`
      <div class="left">
        <div class="logo"></div>
        <h1>Ezer</h1>
      </div>
      <div class="right">
        <button class="icon-btn" @click=${() => {}}>${gearIcon}</button>
      </div>
    `;
  }
}

customElements.define("ezer-header", EzerHeader);
