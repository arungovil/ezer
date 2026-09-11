import { css } from "lit";

export const styles = css`
  :host {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: var(--ez-radius-sm);
    font-size: var(--ez-font-size-sm);
    font-weight: var(--ez-font-weight-medium);
  }

  :host([variant="error"]) {
    background: var(--ez-color-error-bg);
    border: 1px solid var(--ez-color-error-border);
    color: var(--ez-color-error);
  }

  :host([variant="info"]) {
    background: var(--ez-color-primary-muted);
    border: 1px solid var(--ez-color-primary-border);
    color: var(--ez-color-primary-emphasis);
  }

  .dot {
    width: var(--ez-icon-xs);
    height: var(--ez-icon-xs);
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  :host([variant="error"]) .dot {
    background-color: var(--ez-color-error);
  }

  :host([variant="info"]) .dot {
    background-color: var(--ez-color-primary);
  }

  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.85);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;
