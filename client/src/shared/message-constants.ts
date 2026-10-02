// Extension message types — no UI deps (safe for service worker).

export const RUNTIME_MESSAGE_TYPE = {
  CAPTURE_SELECTION: "CAPTURE_SELECTION",
  SELECTION_CAPTURED: "SELECTION_CAPTURED",
  START_CAPTURE: "START_CAPTURE",
  STOP_CAPTURE: "STOP_CAPTURE",
  PING: "PING",
} as const;
