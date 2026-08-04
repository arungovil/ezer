import { LitElement, css, html } from "lit";

export class AgentChat extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }
    h1 {
      font-size: 18px;
      margin: 0 0 8px;
    }
    p {
      color: #666;
      font-size: 13px;
      margin: 0;
    }
  `;

  // State per contract — wired with the UI build.
  isRecording = false;
  isCompiling = false;
  compiledAst = null;
  executionStatus = "idle";

  render() {
    return html`<h1>ezer</h1>
      <p>Workflow agent scaffold</p>`;
  }
}

customElements.define("agent-chat", AgentChat);
