import type { WorkflowContent } from "@src/types.js";
import { renderMarkdown } from "@src/utils/markdown.js";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { styles } from "./message-bubble-workflow.styles.js";

export class MessageBubbleWorkflow extends LitElement {
  @property({ type: Object }) content: WorkflowContent = {
    text: "",
    actions: [],
    replaying: false,
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

  render() {
    const { text, actions, replaying } = this.content;

    return html`
      <div>${renderMarkdown(text)}</div>
      ${
        actions && actions.length > 0
          ? html`
            <button
              class="replay-btn"
              ?disabled=${replaying}
              @click=${this.handleReplay}
            >
              ${replaying ? "⏳ Replaying…" : "▶ Replay"}
            </button>
          `
          : null
      }
    `;
  }
}

customElements.define("message-bubble-workflow", MessageBubbleWorkflow);
