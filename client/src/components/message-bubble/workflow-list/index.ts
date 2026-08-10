import "@src/components/common/ez-button/index.js";
import "@src/components/common/ez-workflow-label/index.js";
import "@src/components/record-button/index.js";
import { playIcon, trashIcon } from "@src/icons/index.js";
import type { Workflow, WorkflowListContent } from "@src/types.js";
import { html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { styles } from "./styles.js";

const PAGE_SIZE = 5;

export class MessageBubbleWorkflowList extends LitElement {
  @property({ type: Object }) content: WorkflowListContent = {
    workflows: [],
  };

  @state() private currentPage = 0;

  static styles = styles;

  private get totalPages() {
    return Math.ceil(this.content.workflows.length / PAGE_SIZE);
  }

  private get hasPagination() {
    return this.content.workflows.length > PAGE_SIZE;
  }

  private get visibleWorkflows() {
    const start = this.currentPage * PAGE_SIZE;
    return this.content.workflows.slice(start, start + PAGE_SIZE);
  }

  protected override willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("content") && this.currentPage >= this.totalPages) {
      this.currentPage = Math.max(0, this.totalPages - 1);
    }
  }

  private handlePrev() {
    if (this.currentPage > 0) this.currentPage -= 1;
  }

  private handleNext() {
    if (this.currentPage < this.totalPages - 1) this.currentPage += 1;
  }

  private handlePlay(workflow: Workflow) {
    if (workflow.actions.length === 0) return;
    this.dispatchEvent(
      new CustomEvent("ez-play-workflow", {
        detail: { workflow },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleDelete(workflow: Workflow) {
    this.dispatchEvent(
      new CustomEvent("ez-delete-workflow", {
        detail: { workflow },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    const { workflows } = this.content;

    return html`
      <ul class="workflow-list">
        ${this.visibleWorkflows.map(
          (workflow) => html`
            <li class="workflow-item">
              <div class="workflow-info">
                <ez-workflow-label .workflow=${workflow}></ez-workflow-label>
              </div>
              <div class="workflow-actions">
                <ez-button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Play workflow"
                  @click=${() => this.handlePlay(workflow)}
                >
                  ${playIcon}
                </ez-button>
                <ez-button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Delete workflow"
                  @click=${() => this.handleDelete(workflow)}
                >
                  ${trashIcon}
                </ez-button>
              </div>
            </li>
          `,
        )}
      </ul>

      ${
        workflows.length > 0
          ? html`
            <div class="footer">
              <record-button></record-button>
              ${
                this.hasPagination
                  ? html`
                    <div class="pagination">
                      <ez-button
                        variant="outline"
                        size="sm"
                        ?disabled=${this.currentPage === 0}
                        @click=${this.handlePrev}
                      >
                        Prev
                      </ez-button>
                      <ez-button
                        variant="outline"
                        size="sm"
                        ?disabled=${this.currentPage >= this.totalPages - 1}
                        @click=${this.handleNext}
                      >
                        Next
                      </ez-button>
                    </div>
                  `
                  : null
              }
            </div>
          `
          : null
      }
    `;
  }
}

customElements.define("message-bubble-workflow-list", MessageBubbleWorkflowList);
