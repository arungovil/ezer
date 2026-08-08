import { css } from "lit";

export const styles = css`
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    padding: 0 var(--ez-space-md);
    box-sizing: border-box;
    margin-bottom: var(--ez-space-md);
    overflow-x: hidden;
  }
  :host([sender="user"]) {
    align-items: flex-end;
  }
  :host([sender="ezer"]) {
    align-items: flex-start;
  }
  .sender-label {
    font-size: var(--ez-font-size-sm);
    font-weight: var(--ez-font-weight-medium);
    color: var(--ez-color-text-muted);
    margin-bottom: var(--ez-space-xs);
    padding: 0 var(--ez-space-xs);
  }
  .bubble {
    max-width: 85%;
    padding: var(--ez-space-sm) var(--ez-space-md);
    border-radius: var(--ez-radius-md);
    font-size: var(--ez-font-size-md);
    line-height: var(--ez-line-height);
    box-sizing: border-box;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .replay-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: var(--ez-space-sm);
    padding: 5px 10px;
    border: 1px solid var(--ez-color-primary);
    border-radius: var(--ez-radius-sm);
    background: var(--ez-color-primary);
    color: var(--ez-color-primary-text);
    font-size: var(--ez-font-size-sm);
    font-weight: var(--ez-font-weight-medium);
    cursor: pointer;
  }
  .replay-btn:hover:not(:disabled) {
    background: var(--ez-color-primary-hover);
  }
  .replay-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  :host([sender="user"]) .bubble {
    background: var(--ez-color-primary);
    color: var(--ez-color-primary-text);
  }
  :host([sender="ezer"]) .bubble {
    background: var(--ez-color-surface);
    color: var(--ez-color-text);
  }
`;
