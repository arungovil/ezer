export const helpPrompt = "What can Ezer help me with?";

export const recordingStartedMessage = `🔴 **Recording started!** Carry out the task you want to automate. When you're done, I'll turn your steps into a reusable workflow.`;

export const workflowListUserPrompt = "Show me my saved workflows";

export function workflowListIntro(count: number): string {
  if (count === 0) {
    return "Nothing saved for this page yet. Record a workflow and it'll appear right here.";
  }
  if (count === 1) {
    return "You've got **1 saved workflow** here:";
  }
  return `Here are your **${count} saved workflows**:`;
}
