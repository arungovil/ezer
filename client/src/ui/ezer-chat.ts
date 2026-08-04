import { css, html, LitElement } from "lit";
import "./ezer-header.js";
import "./ezer-messages.js";
import "./ezer-input.js";

export class EzerChat extends LitElement {
  static properties = {
    isRecording: { type: Boolean, state: true },
    isCompiling: { type: Boolean, state: true },
    compiledAst: { type: Object, state: true },
    executionStatus: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--ez-color-bg);
    }
  `;

  isRecording = false;
  isCompiling = false;
  compiledAst = null;
  executionStatus = "";

  render() {
    return html`
      <ezer-header></ezer-header>
      <ezer-messages></ezer-messages>
      <ezer-input></ezer-input>
    `;
  }
}

customElements.define("ezer-chat", EzerChat);
