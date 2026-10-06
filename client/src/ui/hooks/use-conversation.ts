import { useQuery } from "@tanstack/react-query";

import { loadCaptureConversationForActiveTab } from "@src/sidepanel/capture/index.ts";

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
