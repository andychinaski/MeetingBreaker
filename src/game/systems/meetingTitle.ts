export function truncateMeetingTitle(title: string, maxCharacters: number): string {
  if (maxCharacters < 2) return title.slice(0, Math.max(0, maxCharacters));
  if (title.length <= maxCharacters) return title;
  return `${title.slice(0, maxCharacters - 1).trimEnd()}…`;
}
