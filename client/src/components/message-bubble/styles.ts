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

  :host([sender="user"]) .bubble {
    background: var(--ez-color-primary);
    color: var(--ez-color-primary-text);
  }

  :host([sender="ezer"]) .bubble {
    background: var(--ez-color-surface);
    color: var(--ez-color-text);
  }

  .bubble p {
    margin: 0 0 var(--ez-space-xs) 0;
  }

  .bubble p:last-child {
    margin-bottom: 0;
  }

  .bubble code {
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
    background: rgba(0, 0, 0, 0.08);
    padding: 2px 5px;
    border-radius: var(--ez-radius-sm);
    font-size: 0.9em;
  }

  :host([sender="user"]) .bubble code {
    background: rgba(255, 255, 255, 0.2);
  }

  .bubble pre {
    margin: var(--ez-space-xs) 0;
    padding: var(--ez-space-xs) var(--ez-space-sm);
    background: rgba(0, 0, 0, 0.08);
    border-radius: var(--ez-radius-sm);
    overflow-x: auto;
  }

  :host([sender="user"]) .bubble pre {
    background: rgba(255, 255, 255, 0.2);
  }

  .bubble pre code {
    background: transparent;
    padding: 0;
  }

  .bubble ul,
  .bubble ol {
    margin: var(--ez-space-xs) 0;
    padding-left: var(--ez-space-md);
  }

  .bubble a {
    color: inherit;
    text-decoration: underline;
  }
`;
