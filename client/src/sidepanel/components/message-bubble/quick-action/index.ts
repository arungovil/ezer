import { isChatTaskListContent, normalizeChatContent } from "@src/sidepanel/chat-content.ts";
import type { ChatContent } from "@src/sidepanel/types.ts";
import { renderMarkdown } from "@src/sidepanel/utils/markdown.ts";
import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "@src/sidepanel/components/message-bubble/quick-action/task-list/index.ts";

export class MessageBubbleQuickAction extends LitElement {
  @property() content: string | ChatContent = "";

  render() {
    const resolved = normalizeChatContent(this.content);

    if (isChatTaskListContent(resolved)) {
      return html`<message-bubble-quick-action-task-list
        .content=${resolved}
      ></message-bubble-quick-action-task-list>`;
    }

    return html`<div>${renderMarkdown(resolved.text)}</div>`;
  }
}

customElements.define("message-bubble-quick-action", MessageBubbleQuickAction);
