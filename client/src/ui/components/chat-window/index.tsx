import { ChatEmpty } from "@src/ui/components/chat-empty/index.tsx";
import { ChatHeader } from "@src/ui/components/chat-header/index.tsx";
import { ChatInput } from "@src/ui/components/chat-input/index.tsx";
import { MessageList } from "@src/ui/components/message-list/index.tsx";
import { MessageSkeleton } from "@src/ui/components/message-skeleton/index.tsx";
import { useCaptureMode } from "@src/ui/hooks/use-capture-mode.ts";
import { useCaptureSelection } from "@src/ui/hooks/use-capture-selection.ts";
import { useConversation, useLoadOlderMessages } from "@src/ui/hooks/use-conversation.ts";
import { useSelectionCaptured } from "@src/ui/hooks/use-selection-captured.ts";
import { promptForQuickAction, useSendChat } from "@src/ui/hooks/use-send-chat.ts";
import { useSiteScope } from "@src/ui/hooks/use-site-scope.ts";
import { useStickToBottom } from "@src/ui/hooks/use-stick-to-bottom.ts";

import styles from "./styles.module.css";

export function ChatWindow() {
  const siteScope = useSiteScope();
  const conversation = useConversation(siteScope);
  const sendChat = useSendChat(siteScope);
  const captureSelection = useCaptureSelection(siteScope);
  const messages = conversation.data?.messages ?? [];
  const { scrollerRef, handleScroll, pinToEnd } = useStickToBottom(messages.length);
  const older = useLoadOlderMessages(siteScope, scrollerRef);

  useCaptureMode();
  useSelectionCaptured(captureSelection);

  return (
    <div className={styles.root}>
      <ChatHeader />
      {conversation.isPending ? (
        <MessageSkeleton />
      ) : messages.length > 0 ? (
        <MessageList
          messages={messages}
          scrollerRef={scrollerRef}
          onScroll={handleScroll}
          hasMore={conversation.data?.hasMore ?? false}
          olderStatus={older.status}
          onLoadOlder={older.loadOlder}
        />
      ) : (
        <ChatEmpty />
      )}
      <ChatInput
        onSend={(text) => {
          pinToEnd();
          void sendChat(text);
        }}
        onQuickAction={(action) => {
          pinToEnd();
          void sendChat(promptForQuickAction(action), action);
        }}
      />
    </div>
  );
}
