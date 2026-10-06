import { useEffect } from "react";

import { armCaptureMode, disarmCaptureMode } from "@src/sidepanel/capture/index.ts";

export function useCaptureMode(): void {
  useEffect(() => {
    armCaptureMode();
    return () => {
      disarmCaptureMode();
    };
  }, []);
}
