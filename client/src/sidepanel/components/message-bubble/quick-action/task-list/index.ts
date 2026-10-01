import "@src/sidepanel/components/common/ez-button/index.ts";
import type { ChatTaskListContent } from "@src/shared/chat-content.ts";
import { formatTaskDueAt } from "@src/sidepanel/utils/format.ts";
import { renderMarkdown } from "@src/sidepanel/utils/markdown.ts";
import { html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { styles } from "./styles.ts";

/** Tune list height in the bubble; pagination appears above this count. */
const taskListPageSize = 5;

export class MessageBubbleQuickActionTaskList extends LitElement {
  @property({ type: Object }) content: ChatTaskListContent = {
    format: "taskList",
    kind: "note",
    intro: "",
    items: [],
  };

  @state() private currentPage = 0;

  static styles = styles;

  private get totalPages() {
    return Math.ceil(this.content.items.length / taskListPageSize);
  }

  private get hasPagination() {
    return this.content.items.length > taskListPageSize;
  }

  private get visibleItems() {
    const start = this.currentPage * taskListPageSize;
    return this.content.items.slice(start, start + taskListPageSize);
  }

  protected override willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("content") && this.currentPage >= this.totalPages) {
      this.currentPage = Math.max(0, this.totalPages - 1);
    }
  }

  private handlePrev() {
    if (this.currentPage > 0) {
      this.currentPage -= 1;
    }
  }

  private handleNext() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage += 1;
    }
  }

  render() {
    const showDue = this.content.kind === "reminder";

    return html`
      <p class="intro">${renderMarkdown(this.content.intro)}</p>

      ${
        this.content.items.length > 0
          ? html`
            <ul class="task-list">
              ${this.visibleItems.map(
                (item) => html`
                  <li class="task-item">
                    <span class="task-title">${item.title}</span>
                    ${item.summary ? html`<span class="task-summary">${item.summary}</span>` : null}
                    ${
                      showDue && item.dueAt
                        ? html`<span class="task-due">Due ${formatTaskDueAt(item.dueAt)}</span>`
                        : null
                    }
                  </li>
                `,
              )}
            </ul>
          `
          : null
      }

      ${
        this.hasPagination
          ? html`
            <div class="footer">
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
            </div>
          `
          : null
      }
    `;
  }
}

customElements.define("message-bubble-quick-action-task-list", MessageBubbleQuickActionTaskList);
