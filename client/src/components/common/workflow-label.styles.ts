import { css } from "lit";

export const workflowLabelStyles = css`
  .workflow-name {
    display: flex;
    align-items: center;
    gap: var(--ez-space-xs);
    min-width: 0;
    font-size: var(--ez-font-size-sm);
    font-weight: var(--ez-font-weight-semibold);
    color: var(--ez-color-text);
  }

  .workflow-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    color: var(--ez-color-primary);
  }

  .workflow-icon svg {
    width: 14px;
    height: 14px;
  }

  .workflow-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .workflow-meta {
    font-size: var(--ez-font-size-sm);
    color: var(--ez-color-text-muted);
  }
`;
