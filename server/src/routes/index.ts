import type { Express } from "express";
import { routePaths } from "../config/constants.js";
import { requireUser, requireUserId } from "../middleware/require-user.js";
import { handleCapture, handleConversationMessages } from "./capture.js";
import { handleChat } from "./chat.js";
import { handleHealth } from "./health.js";
import { handleDeleteUser, handleGetUser, handlePutUser } from "./user.js";

export function registerRoutes(app: Express): void {
  app.get(routePaths.health, handleHealth);
  app.get(routePaths.user, requireUserId, handleGetUser);
  app.put(routePaths.user, requireUserId, handlePutUser);
  app.delete(routePaths.user, requireUserId, handleDeleteUser);
  app.post(routePaths.chat, (req, res) => {
    void handleChat(req, res);
  });
  app.post(routePaths.captures, requireUser, (req, res) => {
    void handleCapture(req, res);
  });
  app.get(routePaths.conversationMessages, requireUser, handleConversationMessages);
}
