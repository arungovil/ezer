export async function getActiveTabUrl(): Promise<string | undefined> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    return undefined;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url;
}
