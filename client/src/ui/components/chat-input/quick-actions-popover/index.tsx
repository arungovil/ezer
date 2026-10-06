import { useEffect, useRef } from "react";

import type { QuickActionId } from "@src/sidepanel/types.ts";
import { cx } from "@src/ui/utils/index.ts";

import type { QuickAction } from "../quick-actions.ts";
import styles from "./styles.module.css";

interface QuickActionsPopoverProps {
  open: boolean;
  items: QuickAction[];
  activeIndex: number;
  anchor: HTMLElement | null;
  onSelect: (actionId: QuickActionId) => void;
}

export function QuickActionsPopover({
  open,
  items,
  activeIndex,
  anchor,
  onSelect,
}: QuickActionsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // items.length remeasures the popover when the filtered list height changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: remeasure trigger
  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) {
      return;
    }

    if (!open) {
      if (popover.matches(":popover-open")) {
        popover.hidePopover();
      }
      return;
    }

    if (!popover.matches(":popover-open")) {
      popover.showPopover();
    }

    if (!anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const height = popover.offsetHeight;
    const gap = 16;
    popover.style.top = `${Math.max(gap, rect.top - height - gap)}px`;
    popover.style.left = `${rect.left}px`;
    popover.style.width = `${rect.width}px`;
  }, [open, items.length, anchor]);

  return (
    <div ref={popoverRef} popover="manual" role="listbox" aria-label="Quick actions">
      {items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((action, index) => {
            const active = index === activeIndex;
            const Icon = action.icon;
            return (
              <li key={action.id} role="presentation">
                <button
                  type="button"
                  className={cx(styles.item, active && styles.active)}
                  role="option"
                  aria-selected={active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect(action.id)}
                >
                  <span className={styles.icon}>
                    <Icon />
                  </span>
                  <span className={styles.label}>{action.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={styles.empty}>No matching actions</div>
      )}
    </div>
  );
}
