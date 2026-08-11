import "@src/components/common/ez-button/index.js";
import type { WorkflowContent } from "@src/types.js";
import { renderMarkdown } from "@src/utils/markdown.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./styles.js";

export class MessageBubbleWorkflow extends LitElement {
  @property({ type: Object }) content: WorkflowContent = {
    text: "",
    actions: [],
    replaying: false,
    saved: false,
  };

  static styles = styles;

  private handleReplay() {
    if (this.content.replaying || this.content.actions.length === 0) return;
    this.dispatchEvent(
      new CustomEvent("ez-replay", {
        detail: { actions: this.content.actions },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleSave() {
    if (this.content.saved || this.content.actions.length === 0) return;
    this.dispatchEvent(
      new CustomEvent("ez-save", {
        detail: { actions: this.content.actions },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    const { text, actions, replaying, saved, awaitingName } = this.content;

    return html`
      <div>${renderMarkdown(text)}</div>
      ${
        actions && actions.length > 0
          ? html`
            <div class="actions">
              <ez-button
                variant="primary"
                size="sm"
                ?disabled=${replaying}
                @click=${this.handleReplay}
              >
                ${replaying ? "⏳ Running…" : "▶ Run"}
              </ez-button>
              <ez-button
                variant="outline"
                size="sm"
                ?disabled=${saved || awaitingName}
                @click=${this.handleSave}
              >
                ${saved ? "✓ Saved" : awaitingName ? "Saving" : "💾 Save"}
              </ez-button>
            </div>
          `
          : null
      }
    `;
  }
}

customElements.define("message-bubble-workflow", MessageBubbleWorkflow);
