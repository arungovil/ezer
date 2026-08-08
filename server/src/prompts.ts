// AST contract between server and client — keep in sync with client replayer.

export const AST_JSON_SCHEMA = {
  type: "object",
  properties: {
    workflowName: { type: "string" },
    description: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stepNumber: { type: "integer" },
          action: { enum: ["CLICK", "INPUT"] },
          // Same element, priority order; selectors[0] is primary.
          selectors: { type: "array", items: { type: "string" } },
          value: { type: "string" },
          description: { type: "string" },
        },
        required: ["stepNumber", "action", "selectors", "description"],
      },
    },
  },
  required: ["workflowName", "description", "steps"],
} as const;

export const COMPILE_SYSTEM_PROMPT = `
You compile raw browser interaction logs into a validated workflow AST.

Rules:
- Remove noise: duplicate clicks, blur/focus, redundant submit events paired with button clicks.
- Identify macro intent; name the workflow accordingly.
- One meaningful action per step (action must be CLICK or INPUT).
- Map form SUBMIT events without an explicit button click to a CLICK step on the primary submit button/form control.
- Selectors in a step target the same element, ordered by priority: data-testid > id > name > aria-label > text content.
- Carry value on INPUT only when user-intended (typed text, selected dropdown option, or checked state), not auto-filled.
- Respond with JSON only, matching the schema exactly.
`.trim();
