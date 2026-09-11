import type { Response } from "express";

export function readUserId(res: Response): string {
  const userId = res.locals.userId;
  if (typeof userId !== "string") {
    throw new Error("Missing authenticated user");
  }

  return userId;
}
