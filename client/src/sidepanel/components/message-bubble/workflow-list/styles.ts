import { css } from "lit";

export const styles = [
  css`
    :host {
      display: block;
      width: 280px;
      max-width: 100%;
      box-sizing: border-box;
    }

    .workflow-list {
      list-style: none;
      margin: 0;
      padding: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--ez-space-sm);
    }

    .workflow-item {
      display: flex;
      align-items: center;
      gap: var(--ez-space-sm);
      width: 100%;
      box-sizing: border-box;
      padding: var(--ez-space-sm) var(--ez-space-md);
      border: 1px solid var(--ez-color-border);
      border-radius: var(--ez-radius-md);
      background: var(--ez-color-bg);
      overflow: hidden;
    }

    .workflow-info {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .workflow-actions {
      display: flex;
      gap: var(--ez-space-xs);
      flex-shrink: 0;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-top: var(--ez-space-md);
      width: 100%;
    }

    .pagination {
      display: flex;
      gap: var(--ez-space-xs);
      flex-shrink: 0;
    }
  `,
];
