import { initializeUser } from "@src/sidepanel/api/initialize-user.ts";
import { handleRuntimeMessage } from "./handlers.ts";

void initializeUser();

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  return handleRuntimeMessage(message, sendResponse);
});
