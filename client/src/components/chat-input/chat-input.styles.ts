import { css } from "lit";

export const styles = css`
  :host {
    display: flex;
    align-items: center;
    gap: var(--ez-space-sm);
    flex-shrink: 0;
    padding: var(--ez-space-sm) var(--ez-space-md);
    border-top: 1px solid var(--ez-color-border);
  }
  textarea {
    flex: 1;
    resize: none;
    padding: var(--ez-space-sm);
    border: none;
    border-radius: var(--ez-radius-sm);
    font-family: var(--ez-font-sans);
    font-size: var(--ez-font-size-md);
    line-height: var(--ez-line-height);
    color: var(--ez-color-text);
    background: var(--ez-color-surface);
    outline: none;
    /* single-line baseline, synced with font-size + line-height + padding */
    height: 40px;
    max-height: 128px;
  }
  button {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ez-space-sm);
    border: none;
    border-radius: var(--ez-radius-sm);
    background: var(--ez-color-primary);
    color: var(--ez-color-primary-text);
    cursor: pointer;
  }
  button svg {
    display: block;
    width: 18px;
    height: 18px;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
