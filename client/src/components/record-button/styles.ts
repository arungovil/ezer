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
    font-weight: var(--ez-font-weight-semibold);
    line-height: 1.4;
    box-sizing: border-box;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    user-select: none;
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #b91c1c;
  }

  :host(:hover:not(:disabled)) {
    background: #fee2e2;
    border-color: #f87171;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(220, 38, 38, 0.15);
  }

  :host(:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon {
    display: flex;
    align-items: center;
    color: #dc2626;
  }

  .icon svg {
    width: 14px;
    height: 14px;
  }
`;
