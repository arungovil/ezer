import { css } from "lit";

export const styles = css`
  .capture-text {
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .capture-source {
    display: block;
    margin-top: var(--ez-space-xs);
    font-size: var(--ez-font-size-sm);
    opacity: 0.85;
    color: inherit;
    text-decoration: underline;
    word-break: break-all;
  }
`;
