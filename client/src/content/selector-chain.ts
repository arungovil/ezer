export function buildSelectorChain(element: HTMLElement): string[] {
  const selectors: string[] = [];

  const testId = element.getAttribute("data-testid");
  if (testId) selectors.push(`[data-testid="${testId}"]`);

  if (element.id) selectors.push(`#${element.id}`);

  const name = element.getAttribute("name");
  if (name) selectors.push(`[name="${name}"]`);

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) selectors.push(`[aria-label="${ariaLabel}"]`);

  const tag = element.tagName.toLowerCase();
  const rawText = (element.innerText || element.textContent || "").trim().replace(/\s+/g, " ");
  const truncatedText = rawText.slice(0, 50);

  if (truncatedText) {
    selectors.push(`${tag}:has-text("${truncatedText}")`);
  } else {
    selectors.push(tag);
  }

  return selectors;
}
