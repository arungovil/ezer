import type { InfoPill } from "../types.js";
import { helpCircleIcon, lightbulbIcon, sparklesIcon } from "./icons/index.js";

export const infoPills: InfoPill[] = [
  { id: "what-is-ezer", label: "What is Ezer?", icon: sparklesIcon },
  { id: "how-it-works", label: "How it works", icon: helpCircleIcon },
  { id: "recording-tips", label: "Recording tips", icon: lightbulbIcon },
];

export const infoReplies: Record<string, string> = {
  "how-it-works":
    "Here is how Ezer works in 3 steps:\n\n1. **Record**: Click 'Record New Workflow' and perform your actions on any webpage.\n2. **Compile**: Captured interactions are compiled into a validated AST workflow.\n3. **Replay**: Execute saved workflows anytime to automate DOM actions automatically.",
  "what-is-ezer":
    "**Ezer** is a browser automation assistant. Instead of writing complex scripts, record your real interactions in Chrome once and replay them automatically.",
  "recording-tips":
    "💡 **Best practices for recording:**\n\n• Perform actions deliberately (click directly on standard inputs and buttons).\n• Wait for page navigations to complete before the next step.\n• Review and save your compiled workflow when finished.",
};

export const defaultInfoReply = "How can I help you automate your browser today?";

export const recordingStartedMessage =
  "🔴 **Recording started!** Perform your actions on the active browser tab. I'll capture your interactions and summarize them into a workflow when you stop.";
