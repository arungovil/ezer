export interface ChatRequestBody {
  message: string;
}

export interface ChatResponseBody {
  reply: string;
  rejected: boolean;
}

export interface ChatLlmResult {
  onTopic: boolean;
  message: string;
}

export function parseChatMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const message = (body as ChatRequestBody).message;
  if (typeof message !== "string") {
    return null;
  }

  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isChatLlmResult(value: unknown): value is ChatLlmResult {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChatLlmResult).onTopic === "boolean" &&
    typeof (value as ChatLlmResult).message === "string"
  );
}
