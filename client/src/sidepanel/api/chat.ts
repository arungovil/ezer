import { apiErrorMessages, routePaths } from "./config.ts";
import { requestJson } from "./http-client.ts";
import {
  type ApiResult,
  type ChatListResponseBody,
  type ChatRequestBody,
  type ChatResponseBody,
  isApiErrorBody,
  isChatListResponseBody,
  isChatResponseBody,
} from "./types.ts";

export async function getChatMessages(
  tabUrl: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<ChatListResponseBody>> {
  try {
    const { response, data } = await requestJson(routePaths.chat, {
      query: { tabUrl },
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    if (!isChatListResponseBody(data)) {
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

export async function postChat(
  message: string,
  tabUrl: string,
  options: { signal?: AbortSignal; action?: ChatRequestBody["action"] } = {},
): Promise<ApiResult<ChatResponseBody>> {
  const body: ChatRequestBody = {
    message,
    tabUrl,
    ...(options.action ? { action: options.action } : {}),
  };

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

export async function deleteChatMessage(
  chatId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  try {
    const { response, data } = await requestJson(`${routePaths.chat}/${chatId}`, {
      method: "DELETE",
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : apiErrorMessages.unreachable;
    return { ok: false, message: errorMessage };
  }
}
