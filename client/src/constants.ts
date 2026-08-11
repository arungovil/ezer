import { helpCircleIcon, lightbulbIcon, sparklesIcon } from "@src/icons/index.js";

export const infoPills = [
  { id: "what-is-ezer", label: "What is Ezer?", prompt: "What is Ezer?", icon: sparklesIcon },
  {
    id: "how-it-works",
    label: "How it works",
    prompt: "How does Ezer work?",
    icon: helpCircleIcon,
  },
  {
    id: "recording-tips",
    label: "Recording tips",
    prompt: "How do I record a good workflow?",
    icon: lightbulbIcon,
  },
];

export const infoReplies: Record<string, string> = {
  "how-it-works": `Here's how Ezer works in 3 steps:

1. **Record**: Click 'Record New Workflow' and do what you'd normally do on the page.
2. **Save**: Ezer captures your steps and turns them into a reusable workflow.
3. **Run**: Play back saved workflows anytime — Ezer executes each step automatically.`,
  "what-is-ezer": `**Ezer** is your personal helper for the browser. Instead of doing the same thing over and over, record yourself doing it once and let Ezer repeat it whenever you need.

What you can use it for:

- **Automating workflows** — record a task once and let Ezer repeat it whenever you need.
- **Testing your site** — run the same steps to catch issues before they reach your users.
- **Filling out forms** — skip the repetitive typing on signups, checkouts, and data entry.`,
  "recording-tips": `💡 **Tips for a smooth recording:**

- Click on buttons and fields just like you normally would — no need to be careful.
- Wait for each page to finish loading before moving to the next step.
- Give your workflow a clear name when you're done so it's easy to find later.`,
};

export const defaultInfoReply = `What would you like me to do for you today?`;

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
