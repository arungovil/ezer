import type { RefObject } from "react";

import type { Message } from "@src/sidepanel/types.ts";
import { MessageBubble } from "@src/ui/components/message-bubble/index.tsx";

import styles from "./styles.module.css";

interface MessageListProps {
  messages: Message[];
  scrollerRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

export function MessageList({ messages, scrollerRef, onScroll }: MessageListProps) {
  return (
    <div className={styles.root} ref={scrollerRef} onScroll={onScroll}>
      {messages.map((message) => (
        <div key={message.id} className={styles.item}>
          <MessageBubble message={message} />
        </div>
      ))}
    </div>
  );
}
