const INTERACTIVE_SELECTOR =
  "button, a, [role='button'], input[type='button'], input[type='submit'], summary";

// Closest interactive ancestor, or the target itself.
export function findInteractiveAncestor(target: HTMLElement): HTMLElement {
  return target.closest<HTMLElement>(INTERACTIVE_SELECTOR) ?? target;
}

// Associated label text for a form control.
export function getLabelText(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): string | undefined {
  if (element.labels && element.labels.length > 0) {
    const labelText = element.labels[0].innerText || element.labels[0].textContent || "";
    const clean = labelText.trim().replace(/\s+/g, " ");
    if (clean) return clean.slice(0, 50);
  }
  return undefined;
}

// Normalized and truncated inner text of an element.
export function extractInnerText(element: HTMLElement): string | undefined {
  const raw = (element.innerText || element.textContent || "").trim().replace(/\s+/g, " ");
  return raw ? raw.slice(0, 50) : undefined;
}
