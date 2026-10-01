import { getRequestUserId } from "@src/shared/identity/user-store.ts";
import { initializeUser } from "@src/sidepanel/api/initialize-user.ts";
import { apiErrorMessages, serverBaseUrl } from "./config.ts";
import type { HttpRequestOptions } from "./types.ts";

async function parseJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildUrl(path: string, query?: Record<string, string>): string {
  const url = new URL(`${serverBaseUrl}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function resolveUserId(): Promise<string> {
  try {
    return await getRequestUserId();
  } catch {
    const result = await initializeUser();
    if (!result.ok) {
      throw new Error(result.message);
    }

    return result.data.id;
  }
}

export async function requestJson(
  path: string,
  options: HttpRequestOptions = {},
): Promise<{ response: Response; data: unknown }> {
  const { method = "GET", body, signal, query } = options;
  const userId = await resolveUserId();

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        "X-Ezer-User-Id": userId,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    const data = await parseJsonBody(response);
    return { response, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new Error(apiErrorMessages.unreachable);
  }
}
