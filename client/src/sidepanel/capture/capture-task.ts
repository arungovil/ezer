import { Task } from "@lit/task";
import { postCapture } from "@src/sidepanel/api/capture.js";
import type { CaptureResponseBody } from "@src/sidepanel/api/types.js";
import type { ReactiveControllerHost } from "lit";

export type CaptureTaskArgs = readonly [text: string, tabUrl: string, url?: string, title?: string];

export function createCaptureTask(host: ReactiveControllerHost) {
  return new Task<CaptureTaskArgs, CaptureResponseBody>(host, {
    autoRun: false,
    task: async ([text, tabUrl, url, title], { signal }) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await postCapture(
        {
          text,
          tabUrl,
          ...(url ? { url } : {}),
          ...(title ? { title } : {}),
          timezone,
        },
        { signal },
      );

      if (!result.ok) {
        throw new Error(result.message);
      }

      return result.data;
    },
  });
}
