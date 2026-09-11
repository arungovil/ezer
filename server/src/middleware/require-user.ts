import type { NextFunction, Request, Response } from "express";
import { errorMessages } from "../config/constants.js";
import { upsertUser } from "../db/users.js";
import type { ApiErrorBody } from "../types/api.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUserId(value: string): boolean {
  return uuidPattern.test(value);
}

export function getRequestUserId(req: Request): string {
  const userId = req.header("X-Ezer-User-Id")?.trim();
  if (!userId || !isValidUserId(userId)) {
    throw new Error(errorMessages.userIdRequired);
  }

  return userId;
}

export function requireUser(req: Request, res: Response<ApiErrorBody>, next: NextFunction): void {
  try {
    const userId = getRequestUserId(req);
    upsertUser(userId);
    res.locals.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: errorMessages.userIdRequired });
  }
}
