import { cx } from "@src/ui/utils/index.ts";

import styles from "./styles.module.css";

const rows = [
  { role: "ezer", lines: 2 },
  { role: "user", lines: 1 },
  { role: "ezer", lines: 3 },
] as const;

export function MessageSkeleton() {
  return (
    <div className={styles.root} role="status" aria-label="Loading messages">
      {rows.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static decorative rows
        <div key={index} className={cx(styles.row, styles[row.role])} aria-hidden="true">
          <div className={cx(styles.shimmer, styles.sender)} />
          <div className={styles.bubble}>
            {Array.from({ length: row.lines }, (_, line) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static decorative lines
              <div key={line} className={cx(styles.shimmer, styles.line)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
