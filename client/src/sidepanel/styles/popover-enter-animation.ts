import { css } from "lit";

/**
 * Enter animation for manual `popover` surfaces. Import into any popover component's
 * `static styles` array. Tune per instance with --ez-popover-* on the popover node.
 */
export const popoverEnterAnimation = css`
  [popover] {
    transform-origin: var(--ez-popover-transform-origin, bottom center);
  }

  [popover]:popover-open {
    animation: ez-popover-enter var(--ez-motion-popover-duration) var(--ez-motion-popover-ease)
      both;
  }

  @keyframes ez-popover-enter {
    from {
      opacity: 0;
      transform: translateY(var(--ez-popover-enter-shift, 4px))
        scale(var(--ez-popover-enter-scale, 0.99));
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [popover]:popover-open {
      animation: none;
    }
  }
`;
