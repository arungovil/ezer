import { apiErrorMessages, routePaths } from "./config.js";
import { requestJson } from "./http-client.js";
import {
  type ApiResult,
  type CaptureRequestBody,
  type CaptureResponseBody,
  type ConversationMessagesResponseBody,
  isApiErrorBody,
  isCaptureResponseBody,
  isConversationMessagesResponseBody,
} from "./types.js";

export async function postCapture(
  body: CaptureRequestBody,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CaptureResponseBody>> {
  try {
    const { response, data } = await requestJson(routePaths.captures, {
      method: "POST",
      body,
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    if (!isCaptureResponseBody(data)) {
      return { ok: false, message: apiErrorMessages.invalidResponse };
    }

    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : apiErrorMessages.unreachable;
    return { ok: false, message: errorMessage };
  }
}

export async function getConversationMessages(
  tabUrl: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<ConversationMessagesResponseBody>> {
  try {
    const { response, data } = await requestJson(routePaths.conversationMessages, {
      query: { tabUrl },
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    if (!isConversationMessagesResponseBody(data)) {
      return { ok: false, message: apiErrorMessages.invalidResponse };
    }

    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : apiErrorMessages.unreachable;
    return { ok: false, message: errorMessage };
  }
}
