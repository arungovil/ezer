import { css } from "lit";

export const styles = css`
  :host {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: var(--ez-radius-sm);
    font-family: inherit;
    font-size: var(--ez-font-size-sm);
    line-height: 1.4;
    box-sizing: border-box;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    user-select: none;
  }

  :host([variant="primary"]) {
    background: #eff6ff;
    border: 1px solid #93c5fd;
    color: #1d4ed8;
    font-weight: var(--ez-font-weight-semibold);
  }

  :host([variant="primary"]:hover) {
    background: #dbeafe;
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
  }

  :host([variant="default"]) {
    background: var(--ez-color-surface);
    border: 1px solid var(--ez-color-border);
    color: var(--ez-color-text);
    font-weight: var(--ez-font-weight-normal);
  }

  :host([variant="default"]:hover) {
    background: #f0f6ff;
    border-color: var(--ez-color-primary);
    color: var(--ez-color-primary);
    transform: translateY(-1px);
  }

  .icon {
    display: flex;
    align-items: center;
    color: var(--ez-color-primary);
  }

  .icon svg {
    width: 14px;
    height: 14px;
  }
`;
