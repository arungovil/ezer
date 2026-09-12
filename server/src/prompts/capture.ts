export const captureResponseSchema = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["reminder", "note"] },
    title: { type: "string" },
    dueAt: { type: ["string", "null"] },
    summary: { type: "string" },
    reply: { type: "string" },
  },
  required: ["kind", "title", "dueAt", "summary", "reply"],
} as const;

export const captureSystemPrompt = `
You extract structured reminders and notes from text the user selected in their browser.

Classify the selection into exactly one kind:
- reminder: something to do or follow up on — with or without a specific date/time
  ("submit the report", "tomorrow", "Friday 3pm", "in 2 hours")
- note: reference info, quotes, links, or facts to keep without action

Use the user's timezone when resolving relative dates like "tomorrow" or "next Monday".
If the text is actionable but has no time, use kind "reminder" with dueAt null.
If no time is mentioned and a default is clearly implied, infer one; otherwise leave dueAt null.

Respond with JSON only, matching this schema exactly:
${JSON.stringify(captureResponseSchema)}

Field rules:
- title: short actionable label (max ~80 chars)
- dueAt: ISO 8601 datetime in the user's timezone context, or null
- summary: one plain sentence describing what was saved
- reply: concise friendly markdown for the chat UI confirming what Ezer saved
`.trim();
