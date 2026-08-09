import { css } from "lit";

export const styles = css`
  .record-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: var(--ez-space-sm);
    padding: 5px 12px;
    border: 1px solid var(--ez-color-border);
    border-radius: var(--ez-radius-sm);
    background: transparent;
    color: var(--ez-color-text-muted);
    font-size: var(--ez-font-size-sm);
    font-weight: var(--ez-font-weight-medium);
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .record-btn:hover {
    border-color: var(--ez-color-primary);
    color: var(--ez-color-primary);
  }

  .record-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
