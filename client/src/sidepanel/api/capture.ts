import { apiErrorMessages, routePaths } from "./config.ts";
import { requestJson } from "./http-client.ts";
import {
  type ApiResult,
  type CaptureRequestBody,
  type CaptureResponseBody,
  isApiErrorBody,
  isCaptureResponseBody,
} from "./types.ts";

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
