import { renderMarkdownHtml } from "@src/sidepanel/utils/markdown.ts";

export function Markdown({ text }: { text: string }) {
  if (!text) {
    return null;
  }

  return (
    // Chat history is markdown from our server, rendered with snarkdown.
    // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted markdown HTML
    <div dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(text) }} />
  );
}
