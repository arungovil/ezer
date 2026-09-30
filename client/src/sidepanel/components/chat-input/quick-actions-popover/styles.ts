import { popoverEnterAnimation } from "@src/sidepanel/styles/popover-enter-animation.ts";
import { css } from "lit";

export const styles = [
  popoverEnterAnimation,
  css`
  [popover] {
    position: fixed;
    inset: unset;
    margin: 0;
    padding: var(--ez-space-xs);
    border: 1px solid var(--ez-color-border);
    border-radius: var(--ez-radius-md);
    background: var(--ez-color-bg);
    box-shadow: var(--ez-shadow-sm-subtle);
    max-height: 240px;
    overflow-y: auto;
    box-sizing: border-box;
  }

  [popover]:popover-open {
    display: block;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .item {
    display: flex;
    align-items: center;
    gap: var(--ez-space-sm);
    width: 100%;
    padding: var(--ez-space-sm) var(--ez-space-md);
    border: none;
    border-radius: var(--ez-radius-sm);
    background: transparent;
    color: var(--ez-color-text);
    font-family: var(--ez-font-sans);
    text-align: left;
    cursor: pointer;
  }

  .item:hover:not(:disabled),
  .item.active:not(:disabled) {
    background: var(--ez-color-surface);
  }

  .item:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .icon {
    display: flex;
    flex-shrink: 0;
    width: var(--ez-icon-md);
    height: var(--ez-icon-md);
    color: var(--ez-color-primary);
  }

  .icon ::slotted(svg),
  .icon svg {
    width: 100%;
    height: 100%;
  }

  .label {
    font-size: var(--ez-font-size-sm);
    font-weight: var(--ez-font-weight-medium);
    line-height: var(--ez-line-height);
  }

  .empty {
    padding: var(--ez-space-sm) var(--ez-space-md);
    font-size: var(--ez-font-size-sm);
    color: var(--ez-color-text-muted);
    text-align: center;
  }
`,
];
