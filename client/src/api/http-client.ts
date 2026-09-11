import { apiErrorMessages, serverBaseUrl } from "./config.js";

type HttpMethod = "GET" | "POST";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
}

async function parseJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requestJson(
  path: string,
  options: RequestOptions = {},
): Promise<{ response: Response; data: unknown }> {
  const { method = "GET", body, signal } = options;

  try {
    const response = await fetch(`${serverBaseUrl}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    const data = await parseJsonBody(response);
    return { response, data };
  } catch {
    throw new Error(apiErrorMessages.unreachable);
  }
}
