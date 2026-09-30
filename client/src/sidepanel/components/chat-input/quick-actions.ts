import type { QuickActionId } from "@src/shared/constants.ts";
import { clipboardClockIcon, helpCircleIcon, notebookPenIcon } from "@src/sidepanel/icons/index.ts";
import type { TemplateResult } from "lit";

export type { QuickActionId };

export interface QuickAction {
  id: QuickActionId;
  label: string;
  keywords: string[];
  icon: TemplateResult;
}

export function getQuickActions(): QuickAction[] {
  return [
    {
      id: "notes",
      label: "Notes",
      keywords: ["notes", "note", "saved"],
      icon: notebookPenIcon,
    },
    {
      id: "reminders",
      label: "Reminders",
      keywords: ["reminders", "reminder", "due"],
      icon: clipboardClockIcon,
    },
    {
      id: "help",
      label: "Help",
      keywords: ["help", "guide", "what"],
      icon: helpCircleIcon,
    },
  ];
}

export function filterQuickActions(actions: QuickAction[], query: string): QuickAction[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return actions;

  return actions.filter(
    (action) =>
      action.label.toLowerCase().includes(normalized) ||
      action.keywords.some((keyword) => keyword.includes(normalized)),
  );
}

export function getSlashContext(
  value: string,
  cursor: number,
): { query: string; start: number } | null {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/(?:^|\s)\/([^\s/]*)$/);
  if (!match) return null;

  return {
    query: match[1],
    start: beforeCursor.lastIndexOf("/"),
  };
}
