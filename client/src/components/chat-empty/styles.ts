import { css } from "lit";
import { sharedStyles } from "./shared.styles.js";

export const styles = [
  sharedStyles,
  css`
    .pills-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: var(--ez-space-sm) var(--ez-space-sm);
      width: 100%;
    }
  `,
];
