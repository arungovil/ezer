import { css } from "lit";

export const styles = css`
  :host {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: var(--ez-radius-sm);
    font-size: var(--ez-font-size-xs);
    font-weight: var(--ez-font-weight-medium);
  }

  :host([variant="error"]) {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #991b1b;
  }

  :host([variant="info"]) {
    background: #eff6ff;
    border: 1px solid #93c5fd;
    color: #1e40af;
  }

  .dot {
    width: 8px;
    height: 8px;
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
