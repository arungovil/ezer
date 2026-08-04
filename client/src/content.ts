// ezer content script — recorder & replayer engine (scaffold).
// TODO: capture-phase click/change recording + selector chains
// TODO: EXECUTE_AST replay w/ fallback, 3x retry, pause+prompt

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PING") sendResponse({ ok: true });
  return false;
});
