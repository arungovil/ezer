import type {
  QuickAction,
  QuickActionId,
} from "@src/sidepanel/components/chat-input/quick-actions.ts";
import { html, LitElement, type PropertyValues } from "lit";
import { property, query } from "lit/decorators.js";
import { styles } from "./styles.ts";

export class QuickActionsPopover extends LitElement {
  @property({ type: Boolean }) open = false;
  @property({ type: Array }) items: QuickAction[] = [];
  @property({ type: Number }) activeIndex = 0;
  @property({ attribute: false }) anchor?: HTMLElement;

  static styles = styles;

  @query("[popover]") private popoverEl?: HTMLElement;

  override updated(changed: PropertyValues<this>) {
    if (!this.popoverEl) return;

    if (changed.has("open")) {
      this.syncPopoverOpen();
    }

    if (this.open && (changed.has("open") || changed.has("items") || changed.has("anchor"))) {
      this.positionPopover();
    }
  }

  private syncPopoverOpen() {
    const popover = this.popoverEl;
    if (!popover) return;

    if (this.open) {
      if (!popover.matches(":popover-open")) {
        popover.showPopover();
      }
      this.positionPopover();
      return;
    }

    if (popover.matches(":popover-open")) {
      popover.hidePopover();
    }
  }

  private positionPopover() {
    const popover = this.popoverEl;
    const anchor = this.anchor;
    if (!popover || !anchor) return;

    const rect = anchor.getBoundingClientRect();
    const height = popover.offsetHeight;
    const gap = 16;
    const top = Math.max(gap, rect.top - height - gap);

    popover.style.top = `${top}px`;
    popover.style.left = `${rect.left}px`;
    popover.style.width = `${rect.width}px`;
  }

  private handleSelect(action: QuickAction) {
    this.dispatchEvent(
      new CustomEvent<QuickActionId>("ez-select", {
        detail: action.id,
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div popover="manual" role="listbox" aria-label="Quick actions">
        ${
          this.items.length
            ? html`<ul class="list">
                ${this.items.map((action, index) => {
                  const active = index === this.activeIndex;
                  return html`<li role="presentation">
                    <button
                      type="button"
                      class="item ${active ? "active" : ""}"
                      role="option"
                      aria-selected=${active}
                      @mousedown=${(e: Event) => e.preventDefault()}
                      @click=${() => this.handleSelect(action)}
                    >
                      <span class="icon">${action.icon}</span>
                      <span class="label">${action.label}</span>
                    </button>
                  </li>`;
                })}
              </ul>`
            : html`<div class="empty">No matching actions</div>`
        }
      </div>
    `;
  }
}

customElements.define("quick-actions-popover", QuickActionsPopover);
