// Replay engine — resolve selectors, retry, pace execution, report results.

import type { RecordedAction } from "@src/types.js";
import { executeAction } from "./action-executor.js";
import { hideViewportBorder, showViewportBorder } from "./highlight.js";

const STEP_DELAY_MS = 800;
const RETRY_DELAY_MS = 500;

let isReplaying = false;

export function isReplayActive(): boolean {
  return isReplaying;
}

export async function runReplay(actions: RecordedAction[]): Promise<void> {
  if (isReplaying) return;
  isReplaying = true;

  showViewportBorder();

  try {
    for (const action of actions) {
      if (!isReplaying) break;

      const element = await resolveElement(action.selectors, 3);
      if (!element) {
        chrome.runtime
          .sendMessage({
            type: "REPLAY_ERROR",
            error: `Could not resolve element: ${action.selectors[0] || action.tagName}`,
          })
          .catch(() => {});
        continue;
      }

      try {
        await executeAction(action, element);
      } catch (err) {
        chrome.runtime
          .sendMessage({
            type: "REPLAY_ERROR",
            error: safeErrorMessage(err),
          })
          .catch(() => {});
      }

      await delay(STEP_DELAY_MS);
    }
  } finally {
    hideViewportBorder();
    isReplaying = false;
    chrome.runtime.sendMessage({ type: "REPLAY_COMPLETE" }).catch(() => {});
  }
}

async function resolveElement(selectors: string[], retries: number): Promise<HTMLElement | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          const htmlEl =
            el instanceof HTMLElement
              ? el
              : (el.closest("*") as HTMLElement | null) || (el as unknown as HTMLElement);
          if (htmlEl) return htmlEl;
        }
      } catch {
        // Invalid selector, try next
      }
    }
    if (attempt < retries) await delay(RETRY_DELAY_MS);
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
