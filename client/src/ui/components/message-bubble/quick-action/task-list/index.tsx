import { useState } from "react";

import type { ChatTaskListContent } from "@src/sidepanel/types.ts";
import { formatTaskDueAt } from "@src/sidepanel/utils/format.ts";
import { Button } from "@src/ui/components/common/button/index.tsx";
import { Markdown } from "@src/ui/components/common/markdown/index.tsx";

import styles from "./styles.module.css";

const taskListPageSize = 5;

export function TaskList({ content }: { content: ChatTaskListContent }) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(content.items.length / taskListPageSize));
  const page = Math.min(currentPage, totalPages - 1);
  const start = page * taskListPageSize;
  const visibleItems = content.items.slice(start, start + taskListPageSize);
  const hasPagination = content.items.length > taskListPageSize;
  const showDue = content.kind === "reminder";

  return (
    <div className={styles.root}>
      <div className={styles.intro}>
        <Markdown text={content.intro} />
      </div>

      {content.items.length > 0 ? (
        <ul className={styles.list}>
          {visibleItems.map((item) => (
            <li key={item.id} className={styles.item}>
              <span className={styles.title}>{item.title}</span>
              {item.summary ? <span className={styles.summary}>{item.summary}</span> : null}
              {showDue && item.dueAt ? (
                <span className={styles.due}>Due {formatTaskDueAt(item.dueAt)}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {hasPagination ? (
        <div className={styles.footer}>
          <div className={styles.pagination}>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setCurrentPage(page - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setCurrentPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
