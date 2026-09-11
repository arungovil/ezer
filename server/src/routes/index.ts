import type { Express } from "express";
import { routePaths } from "../config/constants.js";
import { requireUser } from "../middleware/require-user.js";
import { handleCapture, handleConversationMessages } from "./capture.js";
import { handleChat } from "./chat.js";
import { handleHealth } from "./health.js";

export function registerRoutes(app: Express): void {
  app.get(routePaths.health, handleHealth);
  app.post(routePaths.chat, (req, res) => {
    void handleChat(req, res);
  });
  app.post(routePaths.captures, requireUser, (req, res) => {
    void handleCapture(req, res);
  });
  app.get(routePaths.conversationMessages, requireUser, handleConversationMessages);
}
