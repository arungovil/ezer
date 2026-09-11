export const serverBaseUrl = __EZER_SERVER_URL__;

export const routePaths = {
  chat: "/chat",
  captures: "/captures",
  conversationMessages: "/conversations/messages",
} as const;

export const apiErrorMessages = {
  unreachable: "Can't reach the Ezer server. Run `npm run dev:server` and try again.",
  requestFailed: "Something went wrong talking to the Ezer server.",
  invalidResponse: "No reply from the server.",
} as const;
