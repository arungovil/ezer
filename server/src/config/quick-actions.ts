export const quickActionIds = ["notes", "reminders", "help"] as const;

export type QuickActionId = (typeof quickActionIds)[number];

export function isQuickActionId(value: unknown): value is QuickActionId {
  return typeof value === "string" && (quickActionIds as readonly string[]).includes(value);
}

export const helpReply = [
  "I'm Ezer — your side-panel assistant for this **site**.",
  "",
  "- **Highlight** text on the page while this panel is open. I'll save a **note**, or a **reminder** if it's something to do.",
  "- **Ask** about what you've saved here. I only answer from your notes on this page, not general knowledge.",
  "- Type **/** in the input for shortcuts like listing notes or reminders.",
].join("\n");

export function noteListIntro(count: number): string {
  if (count === 0) {
    return "No notes saved for this page yet. Highlight text on the page to capture one.";
  }
  if (count === 1) {
    return "You've got **1 note** here:";
  }
  return `Here are your **${count} notes**:`;
}

export function reminderListIntro(count: number): string {
  if (count === 0) {
    return "No reminders saved for this page yet. Highlight text on the page to capture one.";
  }
  if (count === 1) {
    return "You've got **1 reminder** here:";
  }
  return `Here are your **${count} reminders**:`;
}

function formatReminderLine(title: string, dueAt: string | null): string {
  const due = dueAt ? ` — due ${new Date(dueAt).toLocaleDateString("en-US")}` : "";
  return `- **${title}**${due}`;
}

function formatNoteLine(title: string): string {
  return `- **${title}**`;
}

export function formatNoteListReply(
  tasks: { kind: string; title: string; dueAt: string | null; status: string }[],
): string {
  const notes = tasks.filter((task) => task.kind === "note" && task.status === "active");
  const intro = noteListIntro(notes.length);
  if (notes.length === 0) {
    return intro;
  }

  const lines = notes.map((task) => formatNoteLine(task.title));
  return `${intro}\n\n${lines.join("\n")}`;
}

export function formatReminderListReply(
  tasks: { kind: string; title: string; dueAt: string | null; status: string }[],
): string {
  const reminders = tasks.filter((task) => task.kind === "reminder" && task.status === "active");
  const intro = reminderListIntro(reminders.length);
  if (reminders.length === 0) {
    return intro;
  }

  const lines = reminders.map((task) => formatReminderLine(task.title, task.dueAt));
  return `${intro}\n\n${lines.join("\n")}`;
}
