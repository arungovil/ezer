import { initializeUser } from "@src/shared/identity/initialize-user.ts";
import { handleRuntimeMessage, handleTabActivated, seedActiveTab } from "./handlers.ts";

void initializeUser();
seedActiveTab();

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  handleTabActivated(tabId);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  return handleRuntimeMessage(message, sendResponse);
});
