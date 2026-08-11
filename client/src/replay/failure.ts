import type { RecordedAction } from "@src/types.js";

export type ReplayFailureReason = "selector_not_found" | "execution_error";

export interface ReplayFailure {
  stepNumber: number;
  totalSteps: number;
  reason: ReplayFailureReason;
  action: RecordedAction;
  detail?: string;
}

export function formatReplayFailure(failure: ReplayFailure): string {
  const { stepNumber, totalSteps, reason, action, detail } = failure;
  const stepLabel = `step ${stepNumber} of ${totalSteps}`;
  const selector = action.selectors[0] || action.tagName;
  const actionLabel = describeAction(action);

  if (reason === "selector_not_found") {
    const pageHint =
      stepNumber === 1
        ? " Make sure you're on the page where you recorded this workflow."
        : " An earlier step may have changed the page, or the element was removed.";
    return `⚠️ **Run stopped at ${stepLabel}** (${actionLabel}). Could not find \`${selector}\`.${pageHint} Fix the issue and try again.`;
  }

  const executionDetail = detail ?? "The action could not be completed.";
  return `⚠️ **Run stopped at ${stepLabel}** (${actionLabel}). ${executionDetail} Check the page and try again.`;
}

function describeAction(action: RecordedAction): string {
  switch (action.type) {
    case "CLICK":
      return action.innerText ? `click "${truncate(action.innerText)}"` : "click";
    case "INPUT":
      return "input";
    case "SUBMIT":
      return "submit";
  }
}

function truncate(text: string, max = 30): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
