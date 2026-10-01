import type { Request, Response } from "express";
import { errorMessages } from "../config/constants.ts";
import { readUserId } from "../middleware/read-user-id.ts";
import { toUserResponseBody } from "../parsers.ts";
import { getOrCreateUser, getUser, removeUser } from "../services/user-service.ts";
import type { ApiErrorBody, UserResponseBody } from "../types.ts";

export function handleGetUser(_req: Request, res: Response<UserResponseBody | ApiErrorBody>): void {
  const userId = readUserId(res);
  const user = getUser(userId);

  if (!user) {
    res.status(404).json({ error: errorMessages.userNotFound });
    return;
  }

  res.json(toUserResponseBody(user));
}

export function handlePutUser(_req: Request, res: Response<UserResponseBody | ApiErrorBody>): void {
  const userId = readUserId(res);
  const user = getOrCreateUser(userId);
  res.json(toUserResponseBody(user));
}

export function handleDeleteUser(_req: Request, res: Response<ApiErrorBody | undefined>): void {
  const userId = readUserId(res);
  const deleted = removeUser(userId);

  if (!deleted) {
    res.status(404).json({ error: errorMessages.userNotFound });
    return;
  }

  res.status(204).send();
}
