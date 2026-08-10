import "@src/components/common/ez-pill/index.js";
import "@src/components/record-button/index.js";
import { textAlignStartIcon, workflowIcon } from "@src/icons/index.js";
import type { Workflow } from "@src/types.js";
import { formatActionCount } from "@src/utils/format.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.js";

const RECENT_LIMIT = 3;

export class ChatWorkflows extends LitElement {
  @property({ type: Array }) workflows: Workflow[] = [];

  static styles = styles;

  private get recentWorkflows() {
    return this.workflows.slice(0, RECENT_LIMIT);
  }

  private get hiddenWorkflowCount() {
    return Math.max(0, this.workflows.length - RECENT_LIMIT);
  }

  private get hasMoreWorkflows() {
    return this.hiddenWorkflowCount > 0;
  }

  private handleWorkflowClick(workflow: Workflow) {
    this.dispatchEvent(
      new CustomEvent("ez-select-workflow", {
        detail: { workflow },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleShowAll() {
    this.dispatchEvent(
      new CustomEvent("ez-show-all-workflows", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="hero">
        <h2>Welcome back! 👋</h2>
        <p>Run a saved workflow or record a new one!</p>
      </div>

      <ul class="workflow-list">
        ${this.recentWorkflows.map(
          (workflow) => html`
            <li>
              <button
                type="button"
                class="workflow-item"
                @click=${() => this.handleWorkflowClick(workflow)}
              >
                <span class="workflow-name">
                  <span class="workflow-icon" aria-hidden="true">${workflowIcon}</span>
                  <span class="workflow-title">${workflow.name}</span>
                </span>
                <span class="workflow-meta">${formatActionCount(workflow.actions.length)}</span>
              </button>
            </li>
          `,
        )}
      </ul>

      <div class="pills-container">
        <record-button></record-button>
        ${
          this.hasMoreWorkflows
            ? html`
              <ez-pill
                variant="default"
                .icon=${textAlignStartIcon}
                label="+${this.hiddenWorkflowCount}"
                @click=${this.handleShowAll}
              ></ez-pill>
            `
            : null
        }
      </div>
    `;
  }
}

customElements.define("chat-workflows", ChatWorkflows);
