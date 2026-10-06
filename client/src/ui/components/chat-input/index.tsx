import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { chatInputPlaceholder } from "@src/sidepanel/constants.ts";
import type { QuickActionId } from "@src/sidepanel/types.ts";
import { Button } from "@src/ui/components/common/button/index.tsx";
import { SendIcon } from "@src/ui/icons/index.ts";

import { filterQuickActions, getQuickActions, getSlashContext } from "./quick-actions.ts";
import { QuickActionsPopover } from "./quick-actions-popover/index.tsx";
import styles from "./styles.module.css";

interface ChatInputProps {
  onSend: (text: string) => void;
  onQuickAction: (action: QuickActionId) => void;
}

export function ChatInput({ onSend, onQuickAction }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [slashStart, setSlashStart] = useState(-1);
  const [slashQuery, setSlashQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const quickActionsOpen = slashStart >= 0;
  const filteredActions = filterQuickActions(getQuickActions(), slashQuery);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function closeQuickActions() {
    setSlashStart(-1);
    setSlashQuery("");
    setActiveIndex(0);
  }

  function resizeTextarea(el: HTMLTextAreaElement) {
    el.style.height = "0";
    el.style.height = el.scrollHeight > 40 ? `${el.scrollHeight}px` : "";
  }

  function syncQuickActions(nextValue: string, cursor: number) {
    const context = getSlashContext(nextValue, cursor);
    if (!context) {
      closeQuickActions();
      return;
    }

    setSlashStart(context.start);
    setSlashQuery(context.query);
    setActiveIndex(0);
  }

  function handleSend() {
    const text = value.trim();
    if (!text) {
      return;
    }

    onSend(text);
    setValue("");
    closeQuickActions();
    const el = textareaRef.current;
    if (el) {
      el.style.height = "";
      el.focus();
    }
  }

  function applyQuickAction(actionId: QuickActionId) {
    if (slashStart >= 0) {
      const el = textareaRef.current;
      const end = el?.selectionStart ?? value.length;
      const nextValue = `${value.slice(0, slashStart)}${value.slice(end)}`;
      setValue(nextValue);
      if (el) {
        resizeTextarea(el);
      }
    }

    closeQuickActions();
    onQuickAction(actionId);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (quickActionsOpen) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (filteredActions.length === 0) return;
        setActiveIndex((current) => (current + 1) % filteredActions.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (filteredActions.length === 0) return;
        setActiveIndex(
          (current) => (current - 1 + filteredActions.length) % filteredActions.length,
        );
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeQuickActions();
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const action = filteredActions[activeIndex];
        if (action) {
          applyQuickAction(action.id);
        }
        return;
      }

      if (event.key === "Tab") {
        closeQuickActions();
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        <QuickActionsPopover
          open={quickActionsOpen}
          items={filteredActions}
          activeIndex={activeIndex}
          anchor={textareaRef.current}
          onSelect={applyQuickAction}
        />
        <textarea
          ref={textareaRef}
          aria-label={chatInputPlaceholder}
          placeholder={chatInputPlaceholder}
          value={value}
          onChange={(event) => {
            const el = event.target;
            setValue(el.value);
            resizeTextarea(el);
            syncQuickActions(el.value, el.selectionStart);
          }}
          onKeyDown={handleKeyDown}
        />
        <Button variant="primary" size="icon-md" aria-label="Send" onClick={handleSend}>
          <SendIcon />
        </Button>
      </div>
    </div>
  );
}
