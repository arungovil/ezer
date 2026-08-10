import { virtualize } from "@lit-labs/virtualizer/virtualize.js";
import { defaultInfoReply, infoReplies, recordingStartedMessage } from "@src/constants.js";
import { saveWorkflow } from "@src/db/store.js";
import type {
  Message,
  RecordedAction,
  RuntimeMessage,
  Workflow,
  WorkflowContent,
  WorkflowStatus,
} from "@src/types.js";
import { MESSAGE_TYPE } from "@src/types.js";
import { html, LitElement } from "lit";
import { query, state } from "lit/decorators.js";
import { styles } from "./chat-window.styles.js";
import "@src/components/common/ez-button/index.js";
import "@src/components/common/ez-badge/index.js";
import "@src/components/common/ez-pill/index.js";
import "@src/components/chat-splash/chat-splash.js";
import "@src/components/chat-header/chat-header.js";
import "@src/components/chat-input/chat-input.js";
import "@src/components/message-bubble/index.js";

export class ChatWindow extends LitElement {
  @state() private messages: Message[] = [];
  @state() protected workflowStatus: WorkflowStatus = "idle";

  @query(".messages") private messagesContainer?: HTMLDivElement;

  private replayingMessageId: string | null = null;
  private pendingEmptyMsgId: string | null = null;

  private handleRuntimeMessage = (message: RuntimeMessage) => {
    if (message?.type === "TAB_SWITCHED") {
      this.handleTabSwitched();
      return;
    }
    if (message?.type === "RECORDING_COMPLETE" && message.actions) {
      this.handleRecordingComplete(message.actions);
    }
    if (message?.type === "REPLAY_COMPLETE") {
      this.finishReplay();
    }
    if (message?.type === "REPLAY_ERROR") {
      this.finishReplay();
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(this.handleRuntimeMessage);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.removeListener(this.handleRuntimeMessage);
    }
  }

  static styles = styles;

  protected override updated() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  private handleStartRecording() {
    this.workflowStatus = "recording";

    const msg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.RECORDING,
      content: recordingStartedMessage,
    };
    this.messages = [...this.messages, msg];

    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;

    chrome.runtime
      .sendMessage({
        target: "content",
        payload: { type: "START_RECORDING" },
      })
      .then((response: { error?: string }) => {
        if (response?.error) {
          this.workflowStatus = "idle";
          this.messages = this.messages.map((m) =>
            m.id === msg.id
              ? ({
                  ...m,
                  content:
                    "⚠️ **Could not start recording.** This page doesn't support automation (e.g., Chrome internal pages).",
                } as Message)
              : m,
          );
        }
      })
      .catch(() => {
        this.workflowStatus = "idle";
        this.messages = this.messages.map((m) =>
          m.id === msg.id
            ? ({
                ...m,
                content:
                  "⚠️ **Recording interrupted.** An unexpected error occurred. Please try again.",
              } as Message)
            : m,
        );
      });
  }

  private clearPendingEmptyPlaceholder() {
    if (!this.pendingEmptyMsgId) return;
    this.messages = this.messages.filter((m) => m.id !== this.pendingEmptyMsgId);
    this.pendingEmptyMsgId = null;
  }

  private handleStopRecording() {
    // Always show a stopping acknowledgment immediately, before the async
    // round-trip. If zero actions arrive we keep this placeholder; if actions
    // arrive we remove it and append the workflow card.
    const stoppingMsgId = crypto.randomUUID();
    const stoppingMsg: Message = {
      id: stoppingMsgId,
      role: "ezer",
      type: MESSAGE_TYPE.RECORDING,
      content: "⏹️ **Recording stopped.** No actions were captured.",
    };

    // Keep a reference so handleRecordingComplete can find and remove this
    // placeholder if real actions arrive.
    this.pendingEmptyMsgId = stoppingMsgId;
    this.messages = [...this.messages, stoppingMsg];
    this.workflowStatus = "idle";

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        target: "content",
        payload: { type: "STOP_RECORDING" },
      });
    }
  }

  private handleNewChat() {
    this.messages = [];
    this.workflowStatus = "idle";
    this.pendingEmptyMsgId = null;
  }

  private handleTabSwitched() {
    this.workflowStatus = "idle";
    this.replayingMessageId = null;
    this.clearPendingEmptyPlaceholder();

    // Only notify if there's an active conversation; otherwise stay on splash
    if (this.messages.length === 0) return;

    // Don't stack duplicate tab-switched messages
    const last = this.messages[this.messages.length - 1];
    if (last?.type === MESSAGE_TYPE.TAB_SWITCHED) return;

    const msg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.TAB_SWITCHED,
      content: "🔄 **Tab switched.** Start a new recording on this tab when you're ready.",
    };
    this.messages = [...this.messages, msg];
  }

  private handleRecordingComplete(actions: RecordedAction[]) {
    // If we already showed the empty placeholder (added eagerly in
    // handleStopRecording), remove it only when real actions arrived.
    if (this.pendingEmptyMsgId) {
      if (actions.length === 0) {
        // The placeholder is correct — nothing to change.
        this.pendingEmptyMsgId = null;
        return;
      }
      // Real actions came in: remove the placeholder before appending
      // the workflow card.
      this.messages = this.messages.filter((m) => m.id !== this.pendingEmptyMsgId);
      this.pendingEmptyMsgId = null;
    } else {
      // No placeholder was shown (edge case: recording stopped via tab
      // switch or other external trigger). Show the empty state now.
      if (actions.length === 0) {
        const msg: Message = {
          id: crypto.randomUUID(),
          role: "ezer",
          type: MESSAGE_TYPE.RECORDING,
          content: "⏹️ **Recording stopped.** No actions were captured.",
        };
        this.messages = [...this.messages, msg];
        return;
      }
    }

    const lines = actions.map((action, i) => {
      const primarySelector = action.selectors[0] || action.tagName;
      const valueDetail = action.value !== undefined ? ` (value: "${action.value}")` : "";
      const textDetail = action.innerText && !action.value ? ` ("${action.innerText}")` : "";
      return `${i + 1}. \`${action.type}\` on \`${primarySelector}\`${valueDetail}${textDetail}`;
    });

    const textContent = `⏹️ **Recording stopped.** ${actions.length} action${actions.length > 1 ? "s" : ""} captured:\n\n${lines.join("\n")}`;

    const msg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.WORKFLOW,
      content: {
        text: textContent,
        actions,
        replaying: false,
        saved: false,
      } satisfies WorkflowContent,
    };
    this.messages = [...this.messages, msg];
  }

  private async handleSave(e: CustomEvent<{ actions: RecordedAction[] }>) {
    const { actions } = e.detail;

    const message = this.messages.find(
      (m): m is Extract<Message, { type: typeof MESSAGE_TYPE.WORKFLOW }> =>
        m.type === MESSAGE_TYPE.WORKFLOW && m.content.actions === actions,
    );
    if (!message || message.content.saved) return;

    // Lock immediately so rapid clicks can't enqueue duplicate saves.
    this.messages = this.messages.map((m) => {
      if (m.id !== message.id || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
      return { ...m, content: { ...m.content, saved: true } };
    });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        this.messages = this.messages.map((m) => {
          if (m.id !== message.id || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
          return { ...m, content: { ...m.content, saved: false } };
        });
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "ezer",
          type: MESSAGE_TYPE.RECORDING,
          content: "⚠️ **Could not save workflow.** No active tab found.",
        };
        this.messages = [...this.messages, errorMsg];
        return;
      }

      const workflow: Workflow = {
        id: crypto.randomUUID(),
        tabId: tab.id,
        url: tab.url ?? "",
        name: `Workflow — ${new Date().toLocaleString()}`,
        actions,
        createdAt: Date.now(),
      };

      await saveWorkflow(workflow);

      const confirmMsg: Message = {
        id: crypto.randomUUID(),
        role: "ezer",
        type: MESSAGE_TYPE.RECORDING,
        content: "✅ **Workflow saved!**",
      };
      this.messages = [...this.messages, confirmMsg];
    } catch (err) {
      this.messages = this.messages.map((m) => {
        if (m.id !== message.id || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
        return { ...m, content: { ...m.content, saved: false } };
      });
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "ezer",
        type: MESSAGE_TYPE.RECORDING,
        content: `⚠️ **Failed to save workflow.** ${err instanceof Error ? err.message : "Unknown error"}`,
      };
      this.messages = [...this.messages, errorMsg];
    }
  }

  private handleReplay(e: CustomEvent<{ actions: RecordedAction[] }>) {
    const { actions } = e.detail;

    const message = this.messages.find(
      (m): m is Extract<Message, { type: typeof MESSAGE_TYPE.WORKFLOW }> =>
        m.type === MESSAGE_TYPE.WORKFLOW && m.content.actions === actions,
    );
    if (!message) return;

    this.replayingMessageId = message.id;
    this.workflowStatus = "replaying";

    this.messages = this.messages.map((m) => {
      if (m.id !== message.id || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
      return { ...m, content: { ...m.content, replaying: true } };
    });

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        target: "content",
        payload: { type: "REPLAY_ACTIONS", actions },
      });
    }
  }

  private finishReplay() {
    if (!this.replayingMessageId) return;

    this.messages = this.messages.map((m) => {
      if (m.id !== this.replayingMessageId || m.type !== MESSAGE_TYPE.WORKFLOW) return m;
      return { ...m, content: { ...m.content, replaying: false } };
    });
    this.replayingMessageId = null;
    this.workflowStatus = "idle";
  }

  private handleSelectInfo(e: CustomEvent<{ id: string; prompt: string }>) {
    const { id, prompt } = e.detail;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      type: MESSAGE_TYPE.QUICK_ACTION,
      content: prompt,
    };

    const reply = infoReplies[id] ?? defaultInfoReply;

    const ezerMsg: Message = {
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.QUICK_ACTION,
      content: reply,
    };

    this.messages = [...this.messages, userMsg, ezerMsg];
  }

  private handleSend(e: CustomEvent<{ text: string }>) {
    const text = e.detail.text.trim();
    if (!text) return;
    void this.processMessage(text);
  }

  private async processMessage(text: string) {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      type: MESSAGE_TYPE.TEXT,
      content: text,
    };
    const ezerMsgId = crypto.randomUUID();
    const pendingEzerMsg: Message = {
      id: ezerMsgId,
      role: "ezer",
      type: MESSAGE_TYPE.TEXT,
      content: "",
      loading: true,
    };
    this.messages = [...this.messages, userMsg, pendingEzerMsg];

    const replyText = await this.callApi(text);

    this.messages = this.messages.map((m) =>
      m.id === ezerMsgId && m.type === MESSAGE_TYPE.TEXT
        ? { ...m, content: replyText, loading: false }
        : m,
    );
  }

  // TODO: wire to actual backend
  private async callApi(_text: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 800));
    return "Got it. I'll help with that — API wiring coming soon.";
  }

  render() {
    return html`
      <chat-header
        .workflowStatus=${this.workflowStatus}
        @ez-stop-recording=${this.handleStopRecording}
        @ez-new-chat=${this.handleNewChat}
      ></chat-header>
      ${
        this.messages.length
          ? html`<div
              class="messages"
              @ez-replay=${this.handleReplay}
              @ez-save=${this.handleSave}
              @ez-start-recording=${this.handleStartRecording}
            >
              ${virtualize({
                scroller: true,
                items: this.messages,
                keyFunction: (m: Message) => m.id,
                renderItem: (m: Message) =>
                  html`<div class="message-wrapper" data-message-id=${m.id}>
                    <message-bubble
                      .type=${m.type}
                      sender=${m.role}
                      .content=${m.content}
                      .loading=${m.loading ?? false}
                      .recording=${this.workflowStatus === "recording"}
                    ></message-bubble>
                  </div>`,
              })}
            </div>`
          : html`<chat-splash
              @ez-start-recording=${this.handleStartRecording}
              @ez-select-info=${this.handleSelectInfo}
            ></chat-splash>`
      }
      <chat-input @ez-send=${this.handleSend}></chat-input>
    `;
  }
}

customElements.define("chat-window", ChatWindow);
