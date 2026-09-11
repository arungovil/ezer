// Viewport border overlay for replay session feedback.

let styleInjected = false;
let viewportOverlay: HTMLDivElement | null = null;

function injectStyles(): void {
  if (styleInjected) return;
  styleInjected = true;

  const style = document.createElement("style");
  // Content scripts run on host pages without extension styles.css — define tokens locally.
  style.textContent = `
    #ez-viewport-border {
      --ez-color-primary: #2563eb;
    }

    @keyframes ez-border-pulse {
      0%, 100% { border-color: color-mix(in srgb, var(--ez-color-primary) 60%, transparent); }
      50% { border-color: var(--ez-color-primary); }
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
    border: 4px solid color-mix(in srgb, var(--ez-color-primary) 60%, transparent);
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
