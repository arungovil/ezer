import cors from "cors";
import express from "express";
import { getDb } from "./db/index.ts";
import { registerRoutes } from "./routes/index.ts";

export function createApp(): express.Application {
  getDb();

  const app = express();

  app.use(cors());
  app.use(express.json());
  registerRoutes(app);

  return app;
}
