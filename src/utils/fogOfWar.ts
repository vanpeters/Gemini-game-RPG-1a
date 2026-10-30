import { WORLD_WIDTH, WORLD_HEIGHT } from './worldGenerator';

export const FOG_VISION_RADIUS = 7.5;
export const RADAR_DETECTION_RADIUS = 22;

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseTileKey(key: string): [number, number] {
  const parts = key.split(',');
  return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
}

/**
 * Computes initial explored tiles around a spawn position.
 */
export function getInitialExploredTiles(
  startX: number = 18,
  startY: number = 19,
  radius: number = 8
): string[] {
  const tiles: string[] = [];
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(startX - radius));
  const maxX = Math.min(WORLD_WIDTH - 1, Math.ceil(startX + radius));
  const minY = Math.max(0, Math.floor(startY - radius));
  const maxY = Math.min(WORLD_HEIGHT - 1, Math.ceil(startY + radius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - startX;
      const dy = y - startY;
      if (dx * dx + dy * dy <= r2) {
        tiles.push(tileKey(x, y));
      }
    }
  }

  return tiles;
}

/**
 * Reveals fog of war tiles around the player's current position.
 * Returns updated array and whether any brand new tiles were uncovered.
 */
export function revealFogOfWar(
  existingExplored: string[] | undefined,
  playerX: number,
  playerY: number,
  radius: number = FOG_VISION_RADIUS
): { updatedTiles: string[]; hasNew: boolean } {
  const currentSet = new Set<string>(
    existingExplored && existingExplored.length > 0
      ? existingExplored
      : getInitialExploredTiles(Math.round(playerX), Math.round(playerY), 8)
  );

  let hasNew = false;
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(playerX - radius));
  const maxX = Math.min(WORLD_WIDTH - 1, Math.ceil(playerX + radius));
  const minY = Math.max(0, Math.floor(playerY - radius));
  const maxY = Math.min(WORLD_HEIGHT - 1, Math.ceil(playerY + radius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - playerX;
      const dy = y - playerY;
      if (dx * dx + dy * dy <= r2) {
        const key = tileKey(x, y);
        if (!currentSet.has(key)) {
          currentSet.add(key);
          hasNew = true;
        }
      }
    }
  }

  return {
    updatedTiles: hasNew ? Array.from(currentSet) : existingExplored || Array.from(currentSet),
    hasNew,
  };
}

/**
 * Calculates world exploration percentage.
 */
export function getExplorationStats(exploredCount: number) {
  const total = WORLD_WIDTH * WORLD_HEIGHT; // 6400
  const percent = Math.min(100, Math.round((exploredCount / total) * 1000) / 10);
  return {
    count: exploredCount,
    total,
    percent,
  };
}
