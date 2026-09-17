import { css } from "lit";

export const styles = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--ez-color-bg);
  }
  .messages {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    overflow-anchor: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: var(--ez-space-md) 0;
    box-sizing: border-box;
  }
  .message-wrapper {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
`;
