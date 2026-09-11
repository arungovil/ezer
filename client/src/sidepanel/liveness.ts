// Keeps a long-lived port open to the service worker so the background can tell
// whether the side panel is open. MV3 exposes no "is the side panel open?" API,
// so this port is the source of truth: alive while the panel is open.

const PORT_NAME = "ezer-sidepanel";

let closing = false;

window.addEventListener("pagehide", () => {
  closing = true;
});

export function connectSidePanelLiveness(): void {
  if (typeof chrome === "undefined" || !chrome.runtime?.connect) return;

  const port = chrome.runtime.connect({ name: PORT_NAME });

  // If the service worker was restarted while the panel stayed open, the port
  // dies. Reconnect to re-mark the panel as open — unless the panel itself is
  // being torn down.
  port.onDisconnect.addListener(() => {
    if (closing) return;
    connectSidePanelLiveness();
  });
}
