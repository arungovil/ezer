import { css } from "lit";

export const styles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ez-space-xs);
    border: none;
    border-radius: var(--ez-radius-sm);
    font-family: inherit;
    box-sizing: border-box;
    cursor: pointer;
    transition:
      background var(--ez-transition-fast),
      border-color var(--ez-transition-fast),
      color var(--ez-transition-fast);
    user-select: none;
    white-space: nowrap;
  }

  :host([variant="primary"]) {
    background: var(--ez-color-primary);
    color: var(--ez-color-primary-text);
    border: 1px solid var(--ez-color-primary);
  }

  :host([variant="primary"]:hover:not(:disabled)) {
    background: var(--ez-color-primary-hover);
  }

  :host([variant="outline"]) {
    background: transparent;
    color: var(--ez-color-text-muted);
    border: 1px solid var(--ez-color-border);
  }

  :host([variant="outline"]:hover:not(:disabled)) {
    border-color: var(--ez-color-primary);
    color: var(--ez-color-primary);
  }

  :host([variant="ghost"]) {
    background: none;
    color: var(--ez-color-text-muted);
    border: none;
  }

  :host([variant="ghost"]:hover:not(:disabled)) {
    color: var(--ez-color-text);
  }

  :host([size="sm"]) {
    padding: 3px 8px;
    font-size: var(--ez-font-size-sm);
    font-weight: var(--ez-font-weight-medium);
  }

  :host([size="md"]) {
    padding: var(--ez-space-sm) var(--ez-space-md);
    font-size: var(--ez-font-size-md);
    font-weight: var(--ez-font-weight-medium);
  }

  :host([size="icon-sm"]) {
    padding: var(--ez-space-xs);
    border-radius: var(--ez-radius-sm);
  }

  :host([size="icon-md"]) {
    padding: var(--ez-space-sm);
    border-radius: var(--ez-radius-sm);
  }

  :host(:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ::slotted(svg) {
    display: block;
    flex-shrink: 0;
  }

  :host([size="icon-sm"]) ::slotted(svg),
  :host([size="sm"]) ::slotted(svg) {
    width: var(--ez-icon-sm);
    height: var(--ez-icon-sm);
  }

  :host([size="icon-md"]) ::slotted(svg),
  :host([size="md"]) ::slotted(svg) {
    width: var(--ez-icon-md);
    height: var(--ez-icon-md);
  }
`;
