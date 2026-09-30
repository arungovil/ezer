import "@src/sidepanel/components/chat-input/quick-actions-popover/index.ts";
import "@src/sidepanel/components/common/ez-button/index.ts";
import { sendIcon } from "@src/sidepanel/icons/send.ts";
import { html, LitElement } from "lit";
import { property, query, state } from "lit/decorators.js";
import {
  filterQuickActions,
  getQuickActions,
  getSlashContext,
  type QuickAction,
  type QuickActionId,
} from "./quick-actions.ts";
import { styles } from "./styles.ts";

export class ChatInput extends LitElement {
  @property({ type: String }) placeholder = "What can I help you with?";
  @property({ type: Boolean }) quickActionsEnabled = true;

  @state() private slashStart = -1;
  @state() private slashQuery = "";
  @state() private activeIndex = 0;

  static styles = styles;

  @query("textarea") private textareaEl?: HTMLTextAreaElement;

  private singleLineHeight = 0;

  private get quickActionsOpen() {
    return this.quickActionsEnabled && this.slashStart >= 0;
  }

  private get filteredActions(): QuickAction[] {
    return filterQuickActions(getQuickActions(), this.slashQuery);
  }

  private get selectableActionIndex(): number {
    if (this.filteredActions.length === 0) return -1;
    return this.activeIndex;
  }

  private handleSend() {
    const el = this.textareaEl;
    if (!el?.value.trim()) return;
    this.dispatchEvent(
      new CustomEvent("ez-send", {
        detail: { text: el.value },
        bubbles: true,
        composed: true,
      }),
    );
    el.value = "";
    el.style.height = "";
    this.closeQuickActions();
    el.focus();
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.quickActionsOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.moveActiveIndex(1);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        this.moveActiveIndex(-1);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        this.closeQuickActions();
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.selectActiveAction();
        return;
      }

      if (e.key === "Tab") {
        this.closeQuickActions();
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }

  private moveActiveIndex(direction: 1 | -1) {
    const actions = this.filteredActions;
    if (actions.length === 0) return;

    const current = this.selectableActionIndex;
    const nextPos =
      current < 0
        ? direction === 1
          ? 0
          : actions.length - 1
        : (current + direction + actions.length) % actions.length;

    this.activeIndex = nextPos;
  }

  private selectActiveAction() {
    const index = this.selectableActionIndex;
    if (index < 0) return;

    const action = this.filteredActions[index];
    if (!action) return;

    this.applyQuickAction(action.id);
  }

  private applyQuickAction(actionId: QuickActionId) {
    this.removeSlashQuery();
    this.closeQuickActions();
    this.dispatchEvent(
      new CustomEvent<QuickActionId>("ez-quick-action", {
        detail: actionId,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private removeSlashQuery() {
    const el = this.textareaEl;
    if (!el || this.slashStart < 0) return;

    const end = el.selectionStart;
    el.value = `${el.value.slice(0, this.slashStart)}${el.value.slice(end)}`;
    el.selectionStart = el.selectionEnd = this.slashStart;
    this.resizeTextarea(el);
  }

  private closeQuickActions() {
    this.slashStart = -1;
    this.slashQuery = "";
    this.activeIndex = 0;
  }

  private syncQuickActions() {
    const el = this.textareaEl;
    if (!el || !this.quickActionsEnabled) {
      this.closeQuickActions();
      return;
    }

    const context = getSlashContext(el.value, el.selectionStart);
    if (!context) {
      this.closeQuickActions();
      return;
    }

    this.slashStart = context.start;
    this.slashQuery = context.query;
    this.activeIndex = 0;
  }

  protected override firstUpdated() {
    this.textareaEl?.focus();
  }

  private handleFocus(e: FocusEvent) {
    const el = e.target as HTMLTextAreaElement;
    if (!this.singleLineHeight) {
      this.singleLineHeight = el.scrollHeight;
    }
  }

  private handleInput(e: InputEvent) {
    const el = e.target as HTMLTextAreaElement;
    this.resizeTextarea(el);
    this.syncQuickActions();
  }

  private resizeTextarea(el: HTMLTextAreaElement) {
    if (!this.singleLineHeight) this.singleLineHeight = el.scrollHeight;
    el.style.height = "0";
    if (el.scrollHeight > this.singleLineHeight) {
      el.style.height = `${el.scrollHeight}px`;
    } else {
      el.style.height = "";
    }
  }

  private handleQuickActionSelect(e: CustomEvent<QuickActionId>) {
    this.applyQuickAction(e.detail);
  }

  render() {
    const actions = this.filteredActions;

    return html`
      <div class="input-shell">
        <quick-actions-popover
          .open=${this.quickActionsOpen}
          .items=${actions}
          .activeIndex=${this.activeIndex}
          .anchor=${this.textareaEl}
          @ez-select=${this.handleQuickActionSelect}
        ></quick-actions-popover>
        <textarea
          aria-label=${this.placeholder}
          placeholder=${this.placeholder}
          @focus=${this.handleFocus}
          @input=${this.handleInput}
          @keydown=${this.handleKeydown}
        ></textarea>
        <ez-button variant="primary" size="icon-md" @click=${this.handleSend}>${sendIcon}</ez-button>
      </div>
    `;
  }
}

customElements.define("chat-input", ChatInput);
