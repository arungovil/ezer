import { html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import snarkdown from "snarkdown";

export function renderMarkdown(text: string) {
  if (!text) return html``;
  return unsafeHTML(snarkdown(text));
}
