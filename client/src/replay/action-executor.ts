// DOM action execution — synthetic events that work with React/Vue controlled inputs.

import type { RecordedAction } from "@src/types.js";

export async function executeAction(action: RecordedAction, element: HTMLElement): Promise<void> {
  if (!document.contains(element)) {
    throw new Error("Target element is no longer on the page.");
  }

  element.scrollIntoView?.({ block: "center", behavior: "instant" });

  switch (action.type) {
    case "CLICK":
    case "SUBMIT": {
      const clickTarget = resolveClickTarget(element);
      if (!clickTarget) {
        throw new Error(`No clickable target found for ${action.tagName}.`);
      }
      clickTarget.click();
      break;
    }
    case "INPUT": {
      element.focus?.();
      const applied = await applyInputValue(element, action);
      if (!applied) {
        throw new Error(`Element does not support input: ${action.tagName}.`);
      }
      break;
    }
  }
}

function resolveClickTarget(element: HTMLElement): HTMLElement | null {
  if (typeof element.click === "function") return element;
  return element.closest("a, button, input, [role='button']") as HTMLElement | null;
}

async function applyInputValue(element: HTMLElement, action: RecordedAction): Promise<boolean> {
  const value = action.value ?? "";

  if (
    element instanceof HTMLInputElement &&
    (element.type === "checkbox" || element.type === "radio")
  ) {
    if (action.checked === undefined) return false;

    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "checked",
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(element, action.checked);
    } else {
      element.checked = action.checked;
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const proto =
      element instanceof HTMLInputElement
        ? HTMLInputElement.prototype
        : HTMLTextAreaElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;

    if (nativeSetter) {
      nativeSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  if (element instanceof HTMLSelectElement) {
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  if (element.isContentEditable) {
    element.textContent = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  return false;
}
