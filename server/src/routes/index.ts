import type { Express } from "express";
import { routePaths } from "../config/constants.ts";
import { requireUser, requireUserId } from "../middleware/require-user.ts";
import { handleCapture } from "./capture.ts";
import { handleDeleteChat, handleListChat, handlePostChat } from "./chat.ts";
import { handleHealth } from "./health.ts";
import { handleGetTask, handleListTasks, handlePatchTask, handlePostTask } from "./task.ts";
import { handleDeleteUser, handleGetUser, handlePutUser } from "./user.ts";

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
