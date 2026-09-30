import { getUserById, softDeleteUser, type UserRow, upsertUser } from "../db/user.ts";

export function getOrCreateUser(userId: string): UserRow {
  return upsertUser(userId);
}

export function getUser(userId: string): UserRow | undefined {
  return getUserById(userId);
}

export function removeUser(userId: string): boolean {
  return softDeleteUser(userId);
}
