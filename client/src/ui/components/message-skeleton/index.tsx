import { cx } from "@src/ui/utils/index.ts";

import styles from "./styles.module.css";

type SkeletonRow = { role: "ezer" | "user"; lines: number };

// A short back-and-forth: how many text lines each placeholder bubble has.
const threadRows: SkeletonRow[] = [
  { role: "ezer", lines: 2 },
  { role: "user", lines: 1 },
  { role: "ezer", lines: 3 },
];

const olderRows: SkeletonRow[] = [
  { role: "ezer", lines: 2 },
  { role: "user", lines: 1 },
];

function Rows({ rows }: { rows: SkeletonRow[] }) {
  return rows.map((row, index) => (
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
  ));
}

/** Stands in for the whole thread while the newest page loads; anchored above the input. */
export function MessageSkeleton() {
  return (
    <div className={styles.root} role="status" aria-label="Loading messages">
      <Rows rows={threadRows} />
    </div>
  );
}

/** Sits at the top of the thread while an older page loads. */
export function OlderMessagesSkeleton() {
  return (
    <div className={styles.older} role="status" aria-label="Loading earlier messages">
      <Rows rows={olderRows} />
    </div>
  );
}
