// DOM action execution — synthetic events that work with React/Vue controlled inputs.

import type { RecordedAction } from "@src/types.js";

export async function executeAction(action: RecordedAction, element: HTMLElement): Promise<void> {
  element.scrollIntoView?.({ block: "center", behavior: "instant" });

  switch (action.type) {
    case "CLICK":
    case "SUBMIT":
      if (typeof element.click === "function") {
        element.click();
      } else {
        (element.closest("a, button, input, [role='button']") as HTMLElement | null)?.click();
      }
      break;
    case "INPUT":
      element.focus?.();
      await applyInputValue(element, action);
      break;
  }
}

async function applyInputValue(element: HTMLElement, action: RecordedAction): Promise<void> {
  const value = action.value ?? "";

  if (
    element instanceof HTMLInputElement &&
    (element.type === "checkbox" || element.type === "radio")
  ) {
    if (action.checked !== undefined) {
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
    }
  } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // Use native setter so React/Vue controlled inputs pick up the change
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
  } else if (element instanceof HTMLSelectElement) {
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (element.isContentEditable) {
    element.textContent = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
