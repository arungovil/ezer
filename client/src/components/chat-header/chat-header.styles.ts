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
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ez-space-xs);
    border: none;
    border-radius: var(--ez-radius-sm);
    background: none;
    color: var(--ez-color-text-muted);
    cursor: pointer;
  }
  .icon-btn svg {
    display: block;
    width: 20px;
    height: 20px;
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
    width: 16px;
    height: 16px;
  }
  h1 {
    font-size: var(--ez-font-size-md);
    font-weight: var(--ez-font-weight-semibold);
    margin: 0;
  }
  .recording-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: var(--ez-radius-sm);
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #991b1b;
    font-size: var(--ez-font-size-xs);
    font-weight: var(--ez-font-weight-medium);
  }
  .recording-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--ez-color-error);
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.85);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  .stop-btn {
    padding: 3px 8px;
    border: 1px solid var(--ez-color-border);
    border-radius: var(--ez-radius-sm);
    background: var(--ez-color-surface);
    color: var(--ez-color-text);
    font-size: var(--ez-font-size-xs);
    font-weight: var(--ez-font-weight-medium);
    cursor: pointer;
  }
  .stop-btn:hover {
    background: #f3f4f6;
  }
`;
