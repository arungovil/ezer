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
You save text the user selected in their browser. Notes are the default. Use a reminder only when
the selection is something they need to do.

Classify the selection into exactly one kind:
- note: the usual case — quotes, links, facts, explanations, or anything to keep with no action
- reminder: a task or follow-up ("submit the report", "tomorrow", "Friday 3pm", "in 2 hours")

Use the user's timezone when resolving relative dates like "tomorrow" or "next Monday".
If the text is actionable but has no time, use kind "reminder" with dueAt null.
If no time is mentioned and a default is clearly implied, infer one; otherwise leave dueAt null.
When you are unsure, choose note.

Respond with JSON only, matching this schema exactly:
${JSON.stringify(captureResponseSchema)}

Field rules:
- title: short label for what was saved (max ~80 chars)
- dueAt: ISO 8601 datetime in the user's timezone context, or null (always null for notes)
- summary: one plain sentence describing what was saved
- reply: concise friendly markdown for the chat UI confirming what Ezer saved
`.trim();
