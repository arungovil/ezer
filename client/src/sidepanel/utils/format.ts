export function formatActionCount(count: number): string {
  return `${count} step${count === 1 ? "" : "s"}`;
}

export function formatTaskDueAt(dueAt: string): string {
  return new Date(dueAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
