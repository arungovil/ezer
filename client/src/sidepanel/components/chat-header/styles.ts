import { css } from "lit";

export const styles = css`
  :host {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    height: 48px;
    padding: 0 var(--ez-space-md);
    border-bottom: 1px solid var(--ez-color-border);
  }
  .left,
  .right {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--ez-space-xs);
  }
  .right {
    justify-content: flex-end;
  }
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--ez-color-primary);
    color: var(--ez-color-primary-text);
    margin-right: var(--ez-space-sm);
    flex-shrink: 0;
  }
  .logo svg {
    width: var(--ez-icon-md);
    height: var(--ez-icon-md);
  }
  h1 {
    font-size: var(--ez-font-size-md);
    font-weight: var(--ez-font-weight-semibold);
    margin: 0;
  }
`;
