import type { Workflow } from "@src/shared/types.js";
import { workflowIcon } from "@src/sidepanel/icons/index.js";
import { formatActionCount } from "@src/sidepanel/utils/format.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.js";

export class EzWorkflowLabel extends LitElement {
  @property({ type: Object }) workflow: Workflow | null = null;

  static styles = styles;

  render() {
    const { workflow } = this;

    if (!workflow) return html``;

    return html`
      <span class="workflow-name">
        <span class="workflow-icon" aria-hidden="true">${workflowIcon}</span>
        <span class="workflow-title" title=${workflow.name}>${workflow.name}</span>
      </span>
      <span class="workflow-meta">${formatActionCount(workflow.actions.length)}</span>
    `;
  }
}

customElements.define("ez-workflow-label", EzWorkflowLabel);
