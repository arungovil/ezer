export interface CompileRequestBody {
  rawEvents: unknown[];
}

export interface CompileResponseBody {
  workflowName: string;
  description: string;
  steps: [];
}

export function parseRawEvents(body: unknown): unknown[] | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const rawEvents = (body as CompileRequestBody).rawEvents;
  return Array.isArray(rawEvents) ? rawEvents : null;
}
