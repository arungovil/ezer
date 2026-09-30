import { apiErrorMessages, routePaths } from "./config.ts";
import { requestJson } from "./http-client.ts";
import {
  type ApiResult,
  isApiErrorBody,
  isUserResponseBody,
  type UserResponseBody,
} from "./types.ts";

export async function getUser(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<UserResponseBody>> {
  try {
    const { response, data } = await requestJson(routePaths.user, {
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    if (!isUserResponseBody(data)) {
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

export async function putUser(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<UserResponseBody>> {
  try {
    const { response, data } = await requestJson(routePaths.user, {
      method: "PUT",
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    if (!isUserResponseBody(data)) {
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

export async function deleteUser(options: { signal?: AbortSignal } = {}): Promise<ApiResult<void>> {
  try {
    const { response, data } = await requestJson(routePaths.user, {
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
