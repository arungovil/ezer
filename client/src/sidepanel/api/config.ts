export const serverBaseUrl = __EZER_SERVER_URL__;

export const routePaths = {
  user: "/user",
  chat: "/chat",
  captures: "/captures",
  task: "/task",
} as const;

export const apiErrorMessages = {
  unreachable: "Can't reach the Ezer server. Please try again later.",
  requestFailed: "Something went wrong talking to the Ezer server.",
  invalidResponse: "No reply from the server.",
} as const;
