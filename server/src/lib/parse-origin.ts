export function parsePageOrigin(url: string): string | null {
  try {
    const { origin } = new URL(url);
    return origin.length > 0 ? origin : null;
  } catch {
    return null;
  }
}
