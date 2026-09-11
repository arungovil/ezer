const userIdStorageKey = "ezerUserId";

export async function getOrCreateUserId(): Promise<string> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return crypto.randomUUID();
  }

  const stored = await chrome.storage.local.get(userIdStorageKey);
  const existing = stored[userIdStorageKey];

  if (typeof existing === "string" && existing.length > 0) {
    return existing;
  }

  const userId = crypto.randomUUID();
  await chrome.storage.local.set({ [userIdStorageKey]: userId });
  return userId;
}
