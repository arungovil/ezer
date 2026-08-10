// Viewport border overlay for replay session feedback.

let styleInjected = false;
let viewportOverlay: HTMLDivElement | null = null;

function injectStyles(): void {
  if (styleInjected) return;
  styleInjected = true;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes ez-border-pulse {
      0%, 100% { border-color: rgba(37, 99, 235, 0.6); }
      50% { border-color: rgba(37, 99, 235, 1); }
    }
  `;
  document.head.appendChild(style);
}

export function showViewportBorder(): void {
  injectStyles();

  if (viewportOverlay) return;

  viewportOverlay = document.createElement("div");
  viewportOverlay.id = "ez-viewport-border";
  viewportOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    pointer-events: none;
    box-sizing: border-box;
    border: 4px solid rgba(37, 99, 235, 0.6);
    animation: ez-border-pulse 2s ease-in-out infinite;
  `;
  (document.body || document.documentElement).appendChild(viewportOverlay);
}

export function hideViewportBorder(): void {
  if (viewportOverlay) {
    viewportOverlay.remove();
    viewportOverlay = null;
  }
}
