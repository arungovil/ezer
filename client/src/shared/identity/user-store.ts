const userStorageKey = "ezerUser";

export interface StoredUser {
  id: string;
  createdAt: string;
}

let pendingUserId: string | null = null;

function isNonEmptyId(value: string): boolean {
  return value.trim().length > 0;
}

export function createUserId(): string {
  return crypto.randomUUID();
}

export function setPendingUserId(userId: string | null): void {
  pendingUserId = userId;
}

function isStoredUser(value: unknown): value is StoredUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as StoredUser;
  return typeof user.id === "string" && isNonEmptyId(user.id) && typeof user.createdAt === "string";
}

export async function getStoredUser(): Promise<StoredUser | null> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return null;
  }

  const stored = await chrome.storage.local.get(userStorageKey);
  const user = stored[userStorageKey];

  if (isStoredUser(user)) {
    return user;
  }

  return null;
}

export async function saveStoredUser(user: StoredUser): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  await chrome.storage.local.set({ [userStorageKey]: user });
}

export async function clearStoredUser(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  await chrome.storage.local.remove(userStorageKey);
}

export async function getRequestUserId(): Promise<string> {
  const stored = await getStoredUser();
  if (stored) {
    return stored.id;
  }

  if (pendingUserId) {
    return pendingUserId;
  }

  throw new Error("User not initialized");
}
