export const GAME_ASPECT_RATIO = 16 / 9;

export function calculateViewportHeight(width: number): number {
  return width / GAME_ASPECT_RATIO;
}
