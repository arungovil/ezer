import type { Message } from "@src/sidepanel/types.ts";
import { MESSAGE_TYPE } from "@src/sidepanel/types.ts";
import { Loader } from "@src/ui/components/common/loader/index.tsx";
import { Markdown } from "@src/ui/components/common/markdown/index.tsx";
import { cx } from "@src/ui/utils/index.ts";

import { MessageBubbleCapture } from "./capture/index.tsx";
import { MessageBubbleQuickAction } from "./quick-action/index.tsx";
import styles from "./styles.module.css";

export function MessageBubble({ message }: { message: Message }) {
  return (
    <article className={cx(styles.root, styles[message.role])} data-message-id={message.id}>
      <div className={styles.sender}>{message.role === "user" ? "You" : "Ezer"}</div>
      <div className={styles.body}>
        {message.loading ? <Loader /> : <MessageBubbleContent message={message} />}
      </div>
    </article>
  );
}

function MessageBubbleContent({ message }: { message: Message }) {
  switch (message.type) {
    case MESSAGE_TYPE.CAPTURE:
      return <MessageBubbleCapture content={message.content} />;
    case MESSAGE_TYPE.QUICK_ACTION:
      return <MessageBubbleQuickAction content={message.content} />;
    default:
      return <Markdown text={message.content} />;
  }
}
