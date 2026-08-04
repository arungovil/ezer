import { css, html, LitElement } from "lit";

export class AgentChat extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: var(--ez-space-lg);
    }
    h1 {
      font-size: var(--ez-font-size-lg);
      font-weight: var(--ez-font-weight-semibold);
      margin: 0 0 var(--ez-space-sm);
    }
    p {
      color: var(--ez-color-text-muted);
      font-size: var(--ez-font-size-md);
      margin: 0;
    }
  `;

  isRecording = false;
  isCompiling = false;
  compiledAst: { workflowName: string; description: string; steps: unknown[] } | null = null;
  executionStatus = "idle";

  render() {
    return html`<h1>Ezer</h1><p>Workflow agent scaffold</p>`;
  }
}

customElements.define("agent-chat", AgentChat);
