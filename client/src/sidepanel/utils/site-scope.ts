type SiteKey = string | null;

/** Matches server `parsePageOrigin` — one Ezer chat per site (e.g. `https://github.com`). */
function parsePageOrigin(url: string): SiteKey {
  try {
    const { origin } = new URL(url);
    return origin.length > 0 ? origin : null;
  } catch {
    return null;
  }
}

/**
 * Domain-based chat: reload when the active tab’s site changes, keep the same chat for
 * every tab on that site (e.g. many github.com tabs). Uses URL origin (scheme + host).
 */
export function watchActiveSiteScope(onChange: () => void): () => void {
  if (typeof chrome === "undefined" || !chrome.tabs?.onActivated) {
    return () => {};
  }

  let lastSite: SiteKey | undefined;
  let panelWindowId: number | undefined;

  const getPanelWindowId = async (): Promise<number | undefined> => {
    if (panelWindowId != null) {
      return panelWindowId;
    }
    if (!chrome.windows?.getCurrent) {
      return undefined;
    }
    const win = await chrome.windows.getCurrent();
    panelWindowId = win.id;
    return panelWindowId;
  };

  const considerTab = async (tab: chrome.tabs.Tab): Promise<void> => {
    const windowId = await getPanelWindowId();
    if (windowId != null && tab.windowId !== windowId) {
      return;
    }
    if (!tab.active) {
      return;
    }

    const site = tab.url ? parsePageOrigin(tab.url) : null;
    if (site === lastSite) {
      return;
    }
    lastSite = site;
    onChange();
  };

  const syncActiveTab = async (): Promise<void> => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await considerTab(tab);
      return;
    }
    if (lastSite !== null) {
      lastSite = null;
      onChange();
    }
  };

  const onActivated = (activeInfo: chrome.tabs.TabActiveInfo): void => {
    void chrome.tabs.get(activeInfo.tabId).then((tab) => considerTab(tab));
  };

  const onUpdated = (
    _tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab,
  ): void => {
    if (changeInfo.url != null || changeInfo.status === "complete") {
      void considerTab(tab);
    }
  };

  chrome.tabs.onActivated.addListener(onActivated);
  chrome.tabs.onUpdated.addListener(onUpdated);
  void syncActiveTab();

  return () => {
    chrome.tabs.onActivated.removeListener(onActivated);
    chrome.tabs.onUpdated.removeListener(onUpdated);
  };
}
