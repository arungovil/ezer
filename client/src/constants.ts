import { helpCircleIcon, lightbulbIcon, sparklesIcon } from "@src/icons/index.js";
import type { InfoPill } from "@src/types.js";

export const infoPills: InfoPill[] = [
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
  "how-it-works": `Here is how Ezer works in 3 steps:

1. **Record**: Click 'Record New Workflow' and perform your actions on any webpage.
2. **Compile**: Captured interactions are compiled into a validated AST workflow.
3. **Replay**: Execute saved workflows anytime to automate DOM actions automatically.`,
  "what-is-ezer": `**Ezer** is a browser automation assistant. Instead of writing complex scripts, record your real interactions in your browser once and replay them automatically.

Common use cases:

- **Regression testing** — replay the same workflows on each deploy to catch regressions early.
- **Repetitive data entry** — automate form filling and multi-step CRUD operations.
- **Onboarding guides** — capture sequences for new team members to follow along.`,
  "recording-tips": `💡 **Best practices for recording:**

- Perform actions deliberately (click directly on standard inputs and buttons).
- Wait for page navigations to complete before the next step.
- Review and save your compiled workflow when finished.`,
};

export const defaultInfoReply = `How can I help you automate your browser today?`;

export const recordingStartedMessage = `🔴 **Recording started!** Perform your actions on the active browser tab. I'll capture your interactions and summarize them into a workflow when you stop.`;

export const workflowListUserPrompt = "What workflows have I saved?";

export function workflowListIntro(count: number): string {
  if (count === 0) {
    return "You don't have any saved workflows on this tab yet. Record one and it'll show up here.";
  }
  if (count === 1) {
    return "You've got **1 saved workflow** on this tab:";
  }
  return `Here are your **${count} saved workflows** on this tab:`;
}
