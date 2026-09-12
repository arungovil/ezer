export const notDeleted = "deleted_at IS NULL";

export function softDeleteTimestamp(): string {
  return new Date().toISOString();
}
