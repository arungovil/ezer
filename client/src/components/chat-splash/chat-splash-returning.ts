import "@src/components/record-button/index.js";
import type { Workflow } from "@src/types.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./chat-splash-returning.styles.js";

export class ChatSplashReturning extends LitElement {
  @property({ type: Array }) workflows: Workflow[] = [];

  static styles = styles;

  private handleWorkflowClick(workflow: Workflow) {
    this.dispatchEvent(
      new CustomEvent("ez-select-workflow", {
        detail: { workflow },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private formatActionCount(count: number) {
    return `${count} action${count === 1 ? "" : "s"}`;
  }

  render() {
    return html`
      <div class="hero">
        <h2>Welcome back!👋</h2>
        <p>Run a saved workflow or record a new one!</p>
      </div>

      <ul class="workflow-list">
        ${this.workflows.map(
          (workflow) => html`
            <li>
              <button
                type="button"
                class="workflow-item"
                @click=${() => this.handleWorkflowClick(workflow)}
              >
                <span class="workflow-name">${workflow.name}</span>
                <span class="workflow-meta">${this.formatActionCount(workflow.actions.length)}</span>
              </button>
            </li>
          `,
        )}
      </ul>

      <div class="record-container">
        <record-button></record-button>
      </div>
    `;
  }
}

customElements.define("chat-splash-returning", ChatSplashReturning);
