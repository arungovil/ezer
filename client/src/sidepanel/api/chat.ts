import { apiErrorMessages, routePaths } from "./config.js";
import { requestJson } from "./http-client.js";
import {
  type ApiResult,
  type ChatRequestBody,
  type ChatResponseBody,
  isApiErrorBody,
  isChatResponseBody,
} from "./types.js";

export async function postChat(
  message: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<ChatResponseBody>> {
  const body: ChatRequestBody = { message };

  try {
    const { response, data } = await requestJson(routePaths.chat, {
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

    if (!isChatResponseBody(data)) {
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
