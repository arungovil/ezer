// Replay engine — resolve selectors, retry, pace execution, report results.

import { RUNTIME_MESSAGE_TYPE } from "@src/shared/message-constants.js";
import { formatReplayFailure, type ReplayFailure } from "@src/shared/replay-failure.js";
import type { RecordedAction } from "@src/shared/types.js";
import { executeAction } from "./action-executor.js";
import { hideViewportBorder, showViewportBorder } from "./highlight.js";

const STEP_DELAY_MS = 800;
const RETRY_DELAY_MS = 500;
const SELECTOR_RETRIES = 3;

let isReplaying = false;

export function isReplayActive(): boolean {
  return isReplaying;
}

export async function runReplay(actions: RecordedAction[]): Promise<void> {
  if (isReplaying || actions.length === 0) return;
  isReplaying = true;

  showViewportBorder();

  const totalSteps = actions.length;

  try {
    for (let i = 0; i < actions.length; i++) {
      if (!isReplaying) break;

      const action = actions[i];
      const stepNumber = i + 1;

      const element = await resolveElement(action.selectors, SELECTOR_RETRIES);
      if (!element) {
        reportFailure({
          stepNumber,
          totalSteps,
          reason: "selector_not_found",
          action,
        });
        return;
      }

      try {
        await executeAction(action, element);
      } catch (err) {
        reportFailure({
          stepNumber,
          totalSteps,
          reason: "execution_error",
          action,
          detail: safeErrorMessage(err),
        });
        return;
      }

      await delay(STEP_DELAY_MS);
    }
  } finally {
    hideViewportBorder();
    isReplaying = false;
    chrome.runtime.sendMessage({ type: RUNTIME_MESSAGE_TYPE.REPLAY_COMPLETE }).catch(() => {});
  }
}

function reportFailure(failure: ReplayFailure): void {
  chrome.runtime
    .sendMessage({
      type: RUNTIME_MESSAGE_TYPE.REPLAY_FAILED,
      error: formatReplayFailure(failure),
      failure,
    })
    .catch(() => {});
}

async function resolveElement(selectors: string[], retries: number): Promise<HTMLElement | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (!el) continue;

        const htmlEl =
          el instanceof HTMLElement
            ? el
            : (el.closest("*") as HTMLElement | null) || (el as unknown as HTMLElement);
        if (htmlEl && document.contains(htmlEl)) return htmlEl;
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
