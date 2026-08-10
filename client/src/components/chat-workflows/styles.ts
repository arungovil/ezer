import { sharedStyles } from "@src/components/chat-empty/shared.styles.js";
import { workflowLabelStyles } from "@src/components/common/workflow-label.styles.js";
import { css } from "lit";

export const styles = [
  sharedStyles,
  workflowLabelStyles,
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
        border-color 0.15s ease,
        background 0.15s ease,
        box-shadow 0.15s ease;
    }

    .workflow-item:hover {
      border-color: #93c5fd;
      background: #eff6ff;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.08);
    }

    .workflow-name {
      flex: 1;
    }

    .workflow-meta {
      flex-shrink: 0;
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
