import { sharedStyles } from "@src/sidepanel/components/chat-empty/shared.styles.js";
import { css } from "lit";

export const styles = [
  sharedStyles,
  css`
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
      justify-content: space-between;
      gap: var(--ez-space-md);
      width: 100%;
      padding: var(--ez-space-md);
      border: 1px solid var(--ez-color-border);
      border-radius: var(--ez-radius-md);
      background: var(--ez-color-bg);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      transition:
        border-color var(--ez-transition-fast),
        background var(--ez-transition-fast),
        box-shadow var(--ez-transition-fast);
    }

    .workflow-item:hover {
      border-color: var(--ez-color-primary-border);
      background: var(--ez-color-primary-muted);
      box-shadow: var(--ez-shadow-sm-subtle);
    }

    .pills-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: var(--ez-space-sm);
      width: 100%;
    }
  `,
];
