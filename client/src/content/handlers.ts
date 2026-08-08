// Recording handlers — map DOM events to RecordedActions

import type { CaptureHandler, RecordedAction } from "@src/types.js";
import { extractInnerText, findInteractiveAncestor, getLabelText } from "./dom-utils.js";
import { buildSelectorChain } from "./selector-chain.js";

function captureClick(target: HTMLElement): RecordedAction {
  const interactiveTarget = findInteractiveAncestor(target);

  const selectors = buildSelectorChain(interactiveTarget);
  const innerText = extractInnerText(interactiveTarget);

  return {
    type: "CLICK",
    selectors,
    tagName: interactiveTarget.tagName.toLowerCase(),
    ...(innerText ? { innerText } : {}),
  };
}

function captureChange(target: HTMLElement): RecordedAction | null {
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLTextAreaElement) &&
    !(target instanceof HTMLSelectElement)
  ) {
    return null;
  }

  const tagName = target.tagName.toLowerCase();
  const selectors = buildSelectorChain(target);

  let innerText: string | undefined;
  let checked: boolean | undefined;
  let value = target.value;

  if (target instanceof HTMLSelectElement) {
    const selectedOption = target.options[target.selectedIndex];
    if (selectedOption) {
      innerText = selectedOption.text.trim().slice(0, 50);
    }
  } else if (
    target instanceof HTMLInputElement &&
    (target.type === "checkbox" || target.type === "radio")
  ) {
    checked = target.checked;
    value = String(target.checked);
    innerText = getLabelText(target) ?? extractInnerText(target);
  } else {
    innerText = getLabelText(target) ?? extractInnerText(target);
  }

  return {
    type: "INPUT",
    selectors,
    tagName,
    value,
    ...(checked !== undefined ? { checked } : {}),
    ...(innerText ? { innerText } : {}),
  };
}

function captureSubmit(target: HTMLElement): RecordedAction | null {
  const form = target.tagName === "FORM" ? target : target.closest("form");
  if (!form || !(form instanceof HTMLElement)) return null;

  const selectors = buildSelectorChain(form);
  const innerText = extractInnerText(form);

  return {
    type: "SUBMIT",
    selectors,
    tagName: "form",
    ...(innerText ? { innerText } : {}),
  };
}

export const eventHandlers: Record<string, CaptureHandler> = {
  click: captureClick,
  change: captureChange,
  submit: captureSubmit,
};
