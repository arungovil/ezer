import { css } from "lit";

export const styles = css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: var(--ez-space-xl) var(--ez-space-lg);
    gap: var(--ez-space-lg);
    box-sizing: border-box;
    text-align: center;
    max-width: 380px;
    margin: auto;
  }

  .hero {
    display: flex;
    flex-direction: column;
    gap: var(--ez-space-xs);
  }

  .hero h2 {
    font-size: var(--ez-font-size-lg);
    font-weight: var(--ez-font-weight-semibold);
    color: var(--ez-color-text);
    margin: 0;
  }

  .hero p {
    font-size: var(--ez-font-size-sm);
    color: var(--ez-color-text-muted);
    margin: 0;
    line-height: var(--ez-line-height);
  }

  .pills-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--ez-space-sm) var(--ez-space-sm);
    width: 100%;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 4px;
    font-size: var(--ez-font-size-sm);
    line-height: 1.4;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    user-select: none;
  }

  .pill.record-pill {
    background: #eff6ff;
    border: 1px solid #93c5fd;
    color: #1d4ed8;
    font-weight: var(--ez-font-weight-semibold);
  }

  .pill.record-pill:hover {
    background: #dbeafe;
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
  }

  .pill.record-pill .pill-icon {
    display: flex;
    align-items: center;
    color: var(--ez-color-primary);
  }

  .pill.info-pill {
    background: var(--ez-color-surface);
    border: 1px solid var(--ez-color-border);
    color: var(--ez-color-text);
    font-weight: var(--ez-font-weight-normal);
  }

  .pill.info-pill:hover {
    background: #f0f6ff;
    border-color: var(--ez-color-primary);
    color: var(--ez-color-primary);
    transform: translateY(-1px);
  }

  .pill.info-pill .pill-icon {
    display: flex;
    align-items: center;
    color: var(--ez-color-primary);
  }

  .pill-icon svg {
    width: 14px;
    height: 14px;
  }
`;
