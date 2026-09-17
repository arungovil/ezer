import { apiErrorMessages } from "@src/sidepanel/api/config.js";

export const userErrorMessages = {
  generic: "Something went wrong. Please try again.",
  serverUnreachable: "Can't reach Ezer right now. Check your connection and try again.",
  captureFailed: "Couldn't save your highlight. Please try again.",
  chatFailed: "Couldn't send your message. Please try again.",
  workflowSaveFailed: "Couldn't save your workflow. Please try again.",
  workflowDeleteFailed: "Couldn't remove the workflow. Please try again.",
  replayFailed: "The workflow couldn't finish. Check the page and try again.",
} as const;

export function toUserErrorMessage(
  error: unknown,
  fallback: string = userErrorMessages.generic,
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message) {
    return fallback;
  }

  if (message === apiErrorMessages.unreachable) {
    return userErrorMessages.serverUnreachable;
  }

  if (message === apiErrorMessages.requestFailed || message === apiErrorMessages.invalidResponse) {
    return fallback;
  }

  if (message.startsWith("⚠️") || message.startsWith("⏹️") || message.startsWith("✅")) {
    return message;
  }

  return fallback;
}
