import { getUserById, softDeleteUser, upsertUser } from "../db/user.ts";
import type { UserRow } from "../types.ts";

export function getOrCreateUser(userId: string): UserRow {
  return upsertUser(userId);
}

export function getUser(userId: string): UserRow | undefined {
  return getUserById(userId);
}

export function removeUser(userId: string): boolean {
  return softDeleteUser(userId);
}
