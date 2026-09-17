import {
  noteListIntro,
  noteListUserPrompt,
  reminderListIntro,
  reminderListUserPrompt,
} from "@src/shared/constants.js";
import { getActiveTabUrl } from "@src/shared/tabs/active-tab.js";
import type { ChatWindowHost } from "@src/shared/types.js";
import { MESSAGE_TYPE } from "@src/shared/types.js";
import { listTasks } from "@src/sidepanel/api/task.js";
import type { TaskKind, TaskResponseBody } from "@src/sidepanel/api/types.js";
import { ezerStatusMessage, userTextMessage } from "@src/sidepanel/workflow/messages-handler.js";

function formatReminderLine(task: TaskResponseBody): string {
  const due = task.dueAt ? ` — due ${new Date(task.dueAt).toLocaleDateString()}` : "";
  return `- **${task.title}**${due}`;
}

function formatNoteLine(task: TaskResponseBody): string {
  return `- **${task.title}**`;
}

async function appendTaskKindListMessage(
  host: ChatWindowHost,
  kind: TaskKind,
  userPrompt: string,
  intro: (count: number) => string,
  formatLine: (task: TaskResponseBody) => string,
): Promise<void> {
  const newMessages = [userTextMessage(userPrompt)];
  const tabUrl = await getActiveTabUrl();

  if (!tabUrl) {
    newMessages.push(
      ezerStatusMessage("I couldn't find the current page. Try switching tabs and asking again."),
    );
    host.messages = [...host.messages, ...newMessages];
    return;
  }

  const result = await listTasks(tabUrl, { status: "active" });
  if (!result.ok) {
    newMessages.push(
      ezerStatusMessage("Couldn't load your tasks right now. Try again in a moment."),
    );
    host.messages = [...host.messages, ...newMessages];
    return;
  }

  const tasks = result.data.tasks.filter((task) => task.kind === kind);
  newMessages.push(ezerStatusMessage(intro(tasks.length)));

  if (tasks.length > 0) {
    newMessages.push({
      id: crypto.randomUUID(),
      role: "ezer",
      type: MESSAGE_TYPE.TEXT,
      content: tasks.map(formatLine).join("\n"),
    });
  }

  host.messages = [...host.messages, ...newMessages];
}

export async function appendReminderListMessage(host: ChatWindowHost): Promise<void> {
  await appendTaskKindListMessage(
    host,
    "reminder",
    reminderListUserPrompt,
    reminderListIntro,
    formatReminderLine,
  );
}

export async function appendNoteListMessage(host: ChatWindowHost): Promise<void> {
  await appendTaskKindListMessage(host, "note", noteListUserPrompt, noteListIntro, formatNoteLine);
}
