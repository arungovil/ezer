export const helpPrompt = "What can Ezer help me with?";

export const reminderListUserPrompt = "Show me my reminders";

export const noteListUserPrompt = "Show me my notes";

export function reminderListIntro(count: number): string {
  if (count === 0) {
    return "No reminders saved for this page yet. Highlight text on the page to capture one.";
  }
  if (count === 1) {
    return "You've got **1 reminder** here:";
  }
  return `Here are your **${count} reminders**:`;
}

export function noteListIntro(count: number): string {
  if (count === 0) {
    return "No notes saved for this page yet. Highlight text on the page to capture one.";
  }
  if (count === 1) {
    return "You've got **1 note** here:";
  }
  return `Here are your **${count} notes**:`;
}
