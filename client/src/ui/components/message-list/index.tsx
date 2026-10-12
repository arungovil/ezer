import { type RefObject, useEffect, useRef } from "react";

import type { Message } from "@src/sidepanel/types.ts";
import { Button } from "@src/ui/components/common/button/index.tsx";
import { MessageBubble } from "@src/ui/components/message-bubble/index.tsx";
import { OlderMessagesSkeleton } from "@src/ui/components/message-skeleton/index.tsx";

import styles from "./styles.module.css";

interface MessageListProps {
  messages: Message[];
  scrollerRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  /** Whether the server has older messages than the ones shown. */
  hasMore: boolean;
  olderStatus: "idle" | "loading" | "error";
  onLoadOlder: () => void;
}

export function MessageList({
  messages,
  scrollerRef,
  onScroll,
  hasMore,
  olderStatus,
  onLoadOlder,
}: MessageListProps) {
  const topRef = useRef<HTMLDivElement>(null);

  // Load the next older page as soon as the top of the thread nears the viewport. An observer
  // (rather than a scroll handler) also covers a thread too short to scroll at all.
  useEffect(() => {
    const top = topRef.current;
    const root = scrollerRef.current;
    if (!top || !root || !hasMore || olderStatus !== "idle") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadOlder();
        }
      },
      { root, rootMargin: "160px 0px 0px 0px" },
    );
    observer.observe(top);

    return () => observer.disconnect();
  }, [hasMore, olderStatus, onLoadOlder, scrollerRef]);

  return (
    <div className={styles.root} ref={scrollerRef} onScroll={onScroll}>
      <div ref={topRef} aria-hidden="true" />
      {olderStatus === "loading" ? <OlderMessagesSkeleton /> : null}
      {olderStatus === "error" ? (
        <div className={styles.retry}>
          <span>Couldn't load earlier messages.</span>
          <Button variant="outline" size="sm" onClick={onLoadOlder}>
            Retry
          </Button>
        </div>
      ) : null}
      {messages.map((message) => (
        <div key={message.id} className={styles.item}>
          <MessageBubble message={message} />
        </div>
      ))}
    </div>
  );
}
