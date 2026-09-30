import { apiErrorMessages, routePaths } from "./config.ts";
import { requestJson } from "./http-client.ts";
import {
  type ApiResult,
  type CreateTaskRequestBody,
  isApiErrorBody,
  isTaskListResponseBody,
  isTaskResponseBody,
  type TaskListResponseBody,
  type TaskResponseBody,
  type TaskStatus,
  type UpdateTaskRequestBody,
} from "./types.ts";

export async function listTasks(
  tabUrl: string,
  options: { status?: TaskStatus; signal?: AbortSignal } = {},
): Promise<ApiResult<TaskListResponseBody>> {
  const query: Record<string, string> = { tabUrl };
  if (options.status) {
    query.status = options.status;
  }

  try {
    const { response, data } = await requestJson(routePaths.task, {
      query,
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    if (!isTaskListResponseBody(data)) {
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

export async function getTask(
  taskId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<TaskResponseBody>> {
  try {
    const { response, data } = await requestJson(`${routePaths.task}/${taskId}`, {
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    if (!isTaskResponseBody(data)) {
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

export async function postTask(
  body: CreateTaskRequestBody,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<TaskResponseBody>> {
  try {
    const { response, data } = await requestJson(routePaths.task, {
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

    if (!isTaskResponseBody(data)) {
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

export async function patchTask(
  taskId: string,
  body: UpdateTaskRequestBody,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<TaskResponseBody>> {
  try {
    const { response, data } = await requestJson(`${routePaths.task}/${taskId}`, {
      method: "PATCH",
      body,
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    if (!isTaskResponseBody(data)) {
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
