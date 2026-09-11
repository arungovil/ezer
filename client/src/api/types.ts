export interface ApiErrorBody {
  error: string;
}

export interface ChatRequestBody {
  message: string;
}

export interface ChatResponseBody {
  reply: string;
  rejected: boolean;
}

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  message: string;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" && value !== null && typeof (value as ApiErrorBody).error === "string"
  );
}

export function isChatResponseBody(value: unknown): value is ChatResponseBody {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChatResponseBody).reply === "string" &&
    typeof (value as ChatResponseBody).rejected === "boolean"
  );
}
