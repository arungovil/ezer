import { apiErrorMessages, routePaths } from "./config.js";
import { requestJson } from "./http-client.js";
import {
  type ApiResult,
  type CreateWorkflowRequestBody,
  isApiErrorBody,
  isWorkflowListResponseBody,
  isWorkflowResponseBody,
  type WorkflowListResponseBody,
  type WorkflowResponseBody,
} from "./types.js";

export async function listWorkflows(
  tabUrl: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<WorkflowListResponseBody>> {
  try {
    const { response, data } = await requestJson(routePaths.workflow, {
      query: { tabUrl },
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    if (!isWorkflowListResponseBody(data)) {
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

export async function getWorkflow(
  workflowId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<WorkflowResponseBody>> {
  try {
    const { response, data } = await requestJson(`${routePaths.workflow}/${workflowId}`, {
      signal: options.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: isApiErrorBody(data) ? data.error : apiErrorMessages.requestFailed,
      };
    }

    if (!isWorkflowResponseBody(data)) {
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

export async function postWorkflow(
  body: CreateWorkflowRequestBody,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<WorkflowResponseBody>> {
  try {
    const { response, data } = await requestJson(routePaths.workflow, {
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

    if (!isWorkflowResponseBody(data)) {
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
