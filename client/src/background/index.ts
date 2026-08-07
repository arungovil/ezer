// Ezer background service worker

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== "content") return false;
  void chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id !== undefined) {
      void chrome.tabs.sendMessage(tab.id, message.payload, sendResponse);
    } else {
      sendResponse({ error: "no active tab" });
    }
  });
  return true;
});
