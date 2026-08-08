// Priority-ordered selector chain. Real CSS only — text matching happens on replay via
// the action's innerText field, so no text-based pseudo-classes here.
export function buildSelectorChain(element: HTMLElement): string[] {
  const selectors: string[] = [];
  const tagName = element.tagName.toLowerCase();

  const testId = element.getAttribute("data-testid");
  if (testId) selectors.push(`[data-testid="${escapeAttr(testId)}"]`);

  if (element.id) selectors.push(`#${CSS.escape(element.id)}`);

  const name = element.getAttribute("name");
  if (name) selectors.push(`[name="${escapeAttr(name)}"]`);

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) selectors.push(`[aria-label="${escapeAttr(ariaLabel)}"]`);

  const placeholder = element.getAttribute("placeholder");
  if (placeholder) selectors.push(`[placeholder="${escapeAttr(placeholder)}"]`);

  const type = element.getAttribute("type");
  if (type) selectors.push(`${tagName}[type="${escapeAttr(type)}"]`);

  // Bare tag name as final fallback.
  selectors.push(tagName);

  return selectors;
}

function escapeAttr(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
