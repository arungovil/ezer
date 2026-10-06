import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";

import { ChatWindow } from "@src/ui/components/chat-window/index.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});

export function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ChatWindow />
      </QueryClientProvider>
    </StrictMode>
  );
}
