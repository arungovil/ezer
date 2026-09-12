import type { Request, Response } from "express";
import { errorMessages } from "../config/constants.js";
import { readUserId } from "../middleware/read-user-id.js";
import { getOrCreateUser, getUser, removeUser } from "../services/user-service.js";
import type { ApiErrorBody } from "../types/api.js";
import { toUserResponseBody, type UserResponseBody } from "../types/user.js";

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
