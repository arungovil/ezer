import type { CaptureContent } from "@src/sidepanel/types.ts";

import styles from "./styles.module.css";

export function MessageBubbleCapture({ content }: { content: CaptureContent }) {
  return (
    <div>
      <div className={styles.text}>{content.text}</div>
      {content.url ? (
        <a className={styles.source} href={content.url} target="_blank" rel="noopener noreferrer">
          {content.title || content.url}
        </a>
      ) : null}
    </div>
  );
}
