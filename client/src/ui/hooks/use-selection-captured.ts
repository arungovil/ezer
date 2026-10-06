import { useEffect, useRef } from "react";

import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.ts";
import type { RuntimeMessage } from "@src/sidepanel/types.ts";

export function useSelectionCaptured(
  onCaptured: (text: string, url?: string, title?: string) => void,
): void {
  const onCapturedRef = useRef(onCaptured);
  onCapturedRef.current = onCaptured;

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) {
      return;
    }

    const handleRuntimeMessage = (message: RuntimeMessage) => {
      if (message?.type === RUNTIME_MESSAGE_TYPE.SELECTION_CAPTURED && message.text) {
        onCapturedRef.current(message.text, message.url, message.title);
      }
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
  }, []);
}
