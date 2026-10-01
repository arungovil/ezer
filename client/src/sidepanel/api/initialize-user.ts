import {
  createUserId,
  getStoredUser,
  saveStoredUser,
  setPendingUserId,
} from "@src/shared/identity/user-store.ts";
import type { ApiResult, UserResponseBody } from "@src/sidepanel/api/types.ts";
import { getUser, putUser } from "@src/sidepanel/api/user.ts";

export async function initializeUser(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<UserResponseBody>> {
  const stored = await getStoredUser();
  if (stored) {
    return validateStoredUser(options);
  }

  return registerUser(options);
}

async function validateStoredUser(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<UserResponseBody>> {
  const stored = await getStoredUser();
  if (!stored) {
    return registerUser(options);
  }

  const result = await getUser(options);
  if (result.ok) {
    await saveStoredUser(result.data);
    return result;
  }

  setPendingUserId(stored.id);
  try {
    const restored = await putUser(options);
    if (restored.ok) {
      await saveStoredUser(restored.data);
    }
    return restored;
  } finally {
    setPendingUserId(null);
  }
}

async function registerUser(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<UserResponseBody>> {
  const userId = createUserId();
  setPendingUserId(userId);

  try {
    const result = await putUser(options);
    if (result.ok) {
      await saveStoredUser(result.data);
    }

    return result;
  } finally {
    setPendingUserId(null);
  }
}
