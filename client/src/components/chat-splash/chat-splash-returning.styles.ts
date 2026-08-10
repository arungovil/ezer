import { css } from "lit";
import { sharedStyles } from "./chat-splash.shared.styles.js";

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
      font-size: var(--ez-font-size-sm);
      font-weight: var(--ez-font-weight-semibold);
      color: var(--ez-color-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .workflow-meta {
      flex-shrink: 0;
      font-size: var(--ez-font-size-sm);
      color: var(--ez-color-text-muted);
    }

    .record-container {
      display: flex;
      justify-content: center;
      width: 100%;
    }
  `,
];
