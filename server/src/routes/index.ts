import type { Express } from "express";
import { routePaths } from "../config/constants.js";
import { handleChat } from "./chat.js";
import { handleCompile } from "./compile.js";
import { handleHealth } from "./health.js";

export function registerRoutes(app: Express): void {
  app.get(routePaths.health, handleHealth);
  app.post(routePaths.chat, (req, res) => {
    void handleChat(req, res);
  });
  app.post(routePaths.compile, handleCompile);
}
