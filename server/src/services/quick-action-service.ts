import {
  formatNoteListReply,
  formatReminderListReply,
  helpReply,
  type QuickActionId,
} from "../config/quick-actions.ts";
import { listTasksForTabUrl } from "./task-service.ts";

export function buildQuickActionReply(
  userId: string,
  tabUrl: string,
  action: QuickActionId,
): string {
  if (action === "help") {
    return helpReply;
  }

  const { tasks } = listTasksForTabUrl(userId, tabUrl, "active");

  if (action === "notes") {
    return formatNoteListReply(tasks);
  }

  return formatReminderListReply(tasks);
}
