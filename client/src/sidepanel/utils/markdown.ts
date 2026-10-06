import snarkdown from "snarkdown";

export function renderMarkdownHtml(text: string): string {
  if (!text) return "";
  return snarkdown(text);
}
