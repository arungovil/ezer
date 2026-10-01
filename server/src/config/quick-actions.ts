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

export function taskListPlainText(content: {
  kind: "note" | "reminder";
  intro: string;
  items: { title: string; dueAt: string | null }[];
}): string {
  if (content.items.length === 0) {
    return content.intro;
  }

  const lines =
    content.kind === "reminder"
      ? content.items.map((item) => formatReminderLine(item.title, item.dueAt))
      : content.items.map((item) => formatNoteLine(item.title));

  return `${content.intro}\n\n${lines.join("\n")}`;
}
