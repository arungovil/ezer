export const captureResponseSchema = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["task", "reminder", "note"] },
    title: { type: "string" },
    dueAt: { type: ["string", "null"] },
    summary: { type: "string" },
    reply: { type: "string" },
  },
  required: ["kind", "title", "dueAt", "summary", "reply"],
} as const;

export const captureSystemPrompt = `
You extract structured tasks, reminders, and notes from text the user selected in their browser.

Classify the selection into exactly one kind:
- task: something to do, often without a specific time
- reminder: something tied to a date or time ("tomorrow", "Friday 3pm", "in 2 hours")
- note: reference info, quotes, links, or facts to keep without action

Use the user's timezone when resolving relative dates like "tomorrow" or "next Monday".
If no time is mentioned for a reminder, infer a reasonable default only when the text clearly implies one;
otherwise use kind "task" or "note".

Respond with JSON only, matching this schema exactly:
${JSON.stringify(captureResponseSchema)}

Field rules:
- title: short actionable label (max ~80 chars)
- dueAt: ISO 8601 datetime in the user's timezone context, or null
- summary: one plain sentence describing what was saved
- reply: concise friendly markdown for the chat UI confirming what Ezer saved
`.trim();
