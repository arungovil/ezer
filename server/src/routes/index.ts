import type { Express } from "express";
import { routePaths } from "../config/constants.js";
import { requireUser, requireUserId } from "../middleware/require-user.js";
import { handleCapture } from "./capture.js";
import { handleDeleteChat, handleListChat, handlePostChat } from "./chat.js";
import { handleHealth } from "./health.js";
import { handleGetTask, handleListTasks, handlePatchTask, handlePostTask } from "./task.js";
import { handleDeleteUser, handleGetUser, handlePutUser } from "./user.js";

export function registerRoutes(app: Express): void {
  app.get(routePaths.health, handleHealth);
  app.get(routePaths.user, requireUserId, handleGetUser);
  app.put(routePaths.user, requireUserId, handlePutUser);
  app.delete(routePaths.user, requireUserId, handleDeleteUser);
  app.get(routePaths.chat, requireUser, handleListChat);
  app.post(routePaths.chat, requireUser, (req, res) => {
    void handlePostChat(req, res);
  });
  app.delete(`${routePaths.chat}/:id`, requireUser, handleDeleteChat);
  app.post(routePaths.captures, requireUser, (req, res) => {
    void handleCapture(req, res);
  });
  app.get(routePaths.task, requireUser, handleListTasks);
  app.get(`${routePaths.task}/:id`, requireUser, handleGetTask);
  app.post(routePaths.task, requireUser, handlePostTask);
  app.patch(`${routePaths.task}/:id`, requireUser, handlePatchTask);
}
