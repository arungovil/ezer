import {
  helpReply,
  noteListIntro,
  reminderListIntro,
  taskListPlainText,
} from "../config/quick-actions.ts";
import type {
  ChatContent,
  ChatTaskListContent,
  ChatTaskListItem,
  QuickActionId,
  TaskKind,
} from "../types.ts";
import { listTasksForTabUrl } from "./task-service.ts";

function toListItem(task: {
  id: string;
  title: string;
  summary: string | null;
  dueAt: string | null;
}): ChatTaskListItem {
  return {
    id: task.id,
    title: task.title,
    summary: task.summary,
    dueAt: task.dueAt,
  };
}

function buildTaskListContent(
  kind: TaskKind,
  tasks: {
    id: string;
    kind: string;
    title: string;
    summary: string | null;
    dueAt: string | null;
    status: string;
  }[],
): ChatTaskListContent {
  const items = tasks
    .filter((task) => task.kind === kind && task.status === "active")
    .map(toListItem);
  const intro = kind === "note" ? noteListIntro(items.length) : reminderListIntro(items.length);

  return {
    format: "taskList",
    kind,
    intro,
    items,
  };
}

export function buildQuickActionReply(
  userId: string,
  tabUrl: string,
  action: QuickActionId,
): ChatContent {
  if (action === "help") {
    return { format: "markdown", text: helpReply };
  }

  const { tasks } = listTasksForTabUrl(userId, tabUrl, "active");
  const kind = action === "notes" ? "note" : "reminder";
  return buildTaskListContent(kind, tasks);
}

/** Plain-text `reply` for clients that only read the string field. */
export function quickActionReplyText(content: ChatContent): string {
  if (content.format === "markdown") {
    return content.text;
  }

  return taskListPlainText(content);
}
