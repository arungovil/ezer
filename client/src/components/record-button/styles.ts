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
    line-height: var(--ez-line-height-tight);
    box-sizing: border-box;
    cursor: pointer;
    transition: all var(--ez-transition-fast);
    white-space: nowrap;
    user-select: none;
    background: var(--ez-color-error-bg);
    border: 1px solid var(--ez-color-error-border);
    color: var(--ez-color-error-foreground);
  }

  :host(:hover:not(:disabled)) {
    background: var(--ez-color-error-muted-hover);
    border-color: var(--ez-color-error-border-hover);
    transform: translateY(-1px);
    box-shadow: var(--ez-shadow-sm-error);
  }

  :host(:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon {
    display: flex;
    align-items: center;
    color: var(--ez-color-error-accent);
  }

  .icon svg {
    width: var(--ez-icon-sm);
    height: var(--ez-icon-sm);
  }
`;
