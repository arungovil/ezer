import { flow } from "@lit-labs/virtualizer/layouts/flow.js";
import type { ReactiveController, ReactiveControllerHost } from "lit";

/**
 * Keeps the chat pinned to the latest message using the virtualizer's
 * declarative `pin` layout. Clears when the user scrolls (`unpinned` event).
 */
export class ChatScrollController implements ReactiveController {
  private pinnedIndex: number | null = null;
  private repinOnNextUpdate = false;

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly getMessageCount: () => number,
  ) {
    host.addController(this);
  }

  hostUpdated(): void {
    this.syncMessageCount(this.getMessageCount());
  }

  get layout(): ReturnType<typeof flow> {
    if (this.pinnedIndex === null) {
      return flow();
    }

    return flow({
      pin: { index: this.pinnedIndex, block: "end" },
    });
  }

  /** Pin to the latest message after the next `syncMessageCount` call. */
  pinToEnd(): void {
    this.repinOnNextUpdate = true;
  }

  /** Pin to the latest message (e.g. after loading history). */
  anchorToEnd(messageCount: number): void {
    this.repinOnNextUpdate = false;
    this.setPinnedIndex(messageCount > 0 ? messageCount - 1 : null);
  }

  /** Track list length while pinned; call from `updated` when `messages` changes. */
  syncMessageCount(messageCount: number): void {
    if (messageCount === 0) {
      this.pinnedIndex = null;
      this.repinOnNextUpdate = false;
      return;
    }

    if (this.repinOnNextUpdate) {
      this.repinOnNextUpdate = false;
      this.setPinnedIndex(messageCount - 1);
      return;
    }

    if (this.pinnedIndex !== null) {
      this.setPinnedIndex(messageCount - 1);
    }
  }

  handleUnpinned(): void {
    this.pinnedIndex = null;
    this.repinOnNextUpdate = false;
    this.host.requestUpdate();
  }

  private setPinnedIndex(index: number | null): void {
    if (this.pinnedIndex === index) {
      return;
    }
    this.pinnedIndex = index;
    this.host.requestUpdate();
  }
}
