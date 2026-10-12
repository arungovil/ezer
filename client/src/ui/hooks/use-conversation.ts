import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  loadCaptureConversationForActiveTab,
  loadOlderMessages,
} from "@src/sidepanel/capture/index.ts";
import type { Conversation, Message } from "@src/sidepanel/types.ts";

export function conversationQueryKey(siteScope: string | null) {
  return ["conversation", siteScope] as const;
}

export function useConversation(siteScope: string | null | undefined) {
  return useQuery({
    queryKey: conversationQueryKey(siteScope ?? null),
    queryFn: loadCaptureConversationForActiveTab,
    enabled: siteScope !== undefined,
  });
}

/** Applies a messages-only update (optimistic send, capture result) to the cached thread. */
export function updateConversationMessages(
  queryClient: QueryClient,
  siteScope: string | null,
  update: (messages: Message[]) => Message[],
) {
  queryClient.setQueryData<Conversation>(
    conversationQueryKey(siteScope),
    (current = { messages: [], hasMore: false }) => ({
      ...current,
      messages: update(current.messages),
    }),
  );
}

type OlderStatus = "idle" | "loading" | "error";

/**
 * Pages backwards through the thread. `loadOlder` prepends the next older page to the cached
 * conversation and keeps the viewport on the message the user was looking at.
 */
export function useLoadOlderMessages(
  siteScope: string | null | undefined,
  scrollerRef: RefObject<HTMLDivElement | null>,
) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<OlderStatus>("idle");
  // The site a load is in flight for, and the site currently on screen: a load that finishes
  // after a tab switch still fills its own thread but must not touch the new site's UI state.
  const loadingSiteRef = useRef<string | null>(null);
  const activeSiteRef = useRef(siteScope);
  const anchorRef = useRef<{ height: number; top: number } | null>(null);

  // Runs after every commit but only acts right after a prepend: shifting scrollTop by the
  // height that was added above keeps the same message under the user's eyes.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const anchor = anchorRef.current;
    if (!scroller || !anchor) {
      return;
    }

    anchorRef.current = null;
    scroller.scrollTop = anchor.top + (scroller.scrollHeight - anchor.height);
  });

  useEffect(() => {
    activeSiteRef.current = siteScope;
    setStatus("idle");
  }, [siteScope]);

  const loadOlder = useCallback(async () => {
    // A null scope is a page with no site (chrome://…); there is no thread to page.
    if (!siteScope || loadingSiteRef.current === siteScope) {
      return;
    }

    const key = conversationQueryKey(siteScope);
    const current = queryClient.getQueryData<Conversation>(key);
    const before = current?.messages[0]?.id;
    if (!current?.hasMore || !before) {
      return;
    }

    loadingSiteRef.current = siteScope;
    setStatus("loading");

    try {
      const older = await loadOlderMessages(siteScope, before);
      const isActive = activeSiteRef.current === siteScope;

      const scroller = scrollerRef.current;
      if (scroller && isActive) {
        anchorRef.current = { height: scroller.scrollHeight, top: scroller.scrollTop };
      }

      queryClient.setQueryData<Conversation>(key, (latest) =>
        latest
          ? { messages: [...older.messages, ...latest.messages], hasMore: older.hasMore }
          : latest,
      );
      if (isActive) {
        setStatus("idle");
      }
    } catch {
      if (activeSiteRef.current === siteScope) {
        setStatus("error");
      }
    } finally {
      if (loadingSiteRef.current === siteScope) {
        loadingSiteRef.current = null;
      }
    }
  }, [queryClient, siteScope, scrollerRef]);

  return { loadOlder, status };
}
