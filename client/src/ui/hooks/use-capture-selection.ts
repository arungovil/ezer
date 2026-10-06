import { useQueryClient } from "@tanstack/react-query";

import { postCapture } from "@src/sidepanel/api/capture.ts";
import {
  applyCaptureSuccess,
  applyEzerText,
  userCaptureMessage,
} from "@src/sidepanel/capture/index.ts";
import type { Message } from "@src/sidepanel/types.ts";
import { MESSAGE_TYPE } from "@src/sidepanel/types.ts";
import { getActiveTabUrl } from "@src/sidepanel/utils/index.ts";
import { toUserErrorMessage, userErrorMessages } from "@src/sidepanel/utils/user-message.ts";
import { conversationQueryKey } from "@src/ui/hooks/use-conversation.ts";

const captureDedupeMs = 3000;
let lastCapturedKey = "";
let lastCapturedAt = 0;
let captureInFlight = false;

export function useCaptureSelection(siteScope: string | null | undefined) {
  const queryClient = useQueryClient();

  return async function captureSelection(text: string, url?: string, title?: string) {
    if (siteScope === undefined || captureInFlight) {
      return;
    }

    const tabUrl = url ?? (await getActiveTabUrl());
    if (!tabUrl) {
      return;
    }

    const captureKey = text.trim();
    const now = Date.now();
    if (captureKey === lastCapturedKey && now - lastCapturedAt < captureDedupeMs) {
      return;
    }

    lastCapturedKey = captureKey;
    lastCapturedAt = now;
    captureInFlight = true;

    const userMsg = userCaptureMessage({
      text,
      ...(url ? { url } : {}),
      ...(title ? { title } : {}),
    });
    const ezerMsgId = crypto.randomUUID();
    const pendingEzerMsg: Message = {
      id: ezerMsgId,
      role: "ezer",
      type: MESSAGE_TYPE.TEXT,
      content: "",
      loading: true,
    };

    const queryKey = conversationQueryKey(siteScope);
    queryClient.setQueryData<Message[]>(queryKey, (current = []) => [
      ...current,
      userMsg,
      pendingEzerMsg,
    ]);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await postCapture({
        text,
        tabUrl,
        ...(url ? { url } : {}),
        ...(title ? { title } : {}),
        timezone,
      });

      if (!result.ok) {
        throw new Error(result.message);
      }

      queryClient.setQueryData<Message[]>(queryKey, (current = []) =>
        applyCaptureSuccess(current, userMsg.id, ezerMsgId, result.data),
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      const errorMessage = toUserErrorMessage(error, userErrorMessages.captureFailed);
      queryClient.setQueryData<Message[]>(queryKey, (current = []) =>
        applyEzerText(current, ezerMsgId, `⚠️ **${errorMessage}**`),
      );
    } finally {
      captureInFlight = false;
    }
  };
}
