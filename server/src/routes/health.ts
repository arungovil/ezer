import type { Request, Response } from "express";
import type { HealthResponseBody } from "../types/api.js";

export function handleHealth(_req: Request, res: Response<HealthResponseBody>): void {
  res.json({ status: "ok" });
}
