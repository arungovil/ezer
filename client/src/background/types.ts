export type WorkerInboundMessage = {
  type?: string;
  target?: string;
  payload?: unknown;
  text?: unknown;
  url?: unknown;
  title?: unknown;
};
