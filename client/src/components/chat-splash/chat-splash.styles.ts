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
`;
