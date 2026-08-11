export function formatActionCount(count: number): string {
  return `${count} step${count === 1 ? "" : "s"}`;
}
