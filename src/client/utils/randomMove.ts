import { IMPASSABLE_TILE_NAME_PARTS } from '../data/consts';
import { isNeighborTile } from './adjacency';

type Tile = {
  id: number;
  positionX: number;
  positionZ: number;
  tileName: string;
};

type Avatar = { id: number; tileID: number; statistics: { hp: number } };

// `avoidTileId` (typically wherever the mover stood before its last move) is
// excluded from the candidates when there's any other option, so an AI
// avatar doesn't just oscillate back and forth between the same two tiles —
// but it's kept as a last resort so a dead end doesn't strand the mover.
const getFreeNeighborTiles = <T extends Avatar>(
  originTile: { id: number; positionX: number; positionZ: number },
  avatars: T[],
  tiles: Tile[],
  avoidTileId?: number
): Tile[] => {
  // A dead avatar no longer occupies its tile.
  const occupiedTileIds = new Set(
    avatars.filter((avatar) => avatar.statistics.hp > 0).map(({ tileID }) => tileID)
  );
  const candidates = tiles.filter(
    (tile) =>
      tile.id !== originTile.id &&
      isNeighborTile(tile, originTile) &&
      !occupiedTileIds.has(tile.id) &&
      !IMPASSABLE_TILE_NAME_PARTS.some((part) => tile.tileName.includes(part))
  );
  if (avoidTileId === undefined) return candidates;
  const withoutAvoided = candidates.filter((tile) => tile.id !== avoidTileId);
  return withoutAvoided.length > 0 ? withoutAvoided : candidates;
};

// Picks a random passable, unoccupied tile adjacent to `originTile` — the
// same validity rules as a normal move. Returns null if boxed in.
export const getRandomFreeNeighborTile = <T extends Avatar>(
  originTile: { id: number; positionX: number; positionZ: number },
  avatars: T[],
  tiles: Tile[],
  avoidTileId?: number
): Tile | null => {
  const candidates = getFreeNeighborTiles(originTile, avatars, tiles, avoidTileId);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
};

const tileDistance = (
  a: { positionX: number; positionZ: number },
  b: { positionX: number; positionZ: number }
) => Math.hypot(a.positionX - b.positionX, a.positionZ - b.positionZ);

// Picks the free neighbor tile that gets closest to `targetTile` — for AI
// classes that seek contact with the enemy. Returns null if boxed in.
export const getNeighborTileTowards = <T extends Avatar>(
  originTile: { id: number; positionX: number; positionZ: number },
  avatars: T[],
  tiles: Tile[],
  targetTile: { positionX: number; positionZ: number },
  avoidTileId?: number
): Tile | null => {
  const candidates = getFreeNeighborTiles(originTile, avatars, tiles, avoidTileId);
  if (candidates.length === 0) return null;
  return candidates.reduce((closest, tile) =>
    tileDistance(tile, targetTile) < tileDistance(closest, targetTile) ? tile : closest
  );
};

// Picks the free neighbor tile that gets furthest from `targetTile` — for
// AI classes that avoid contact. Returns null if boxed in.
export const getNeighborTileAwayFrom = <T extends Avatar>(
  originTile: { id: number; positionX: number; positionZ: number },
  avatars: T[],
  tiles: Tile[],
  targetTile: { positionX: number; positionZ: number },
  avoidTileId?: number
): Tile | null => {
  const candidates = getFreeNeighborTiles(originTile, avatars, tiles, avoidTileId);
  if (candidates.length === 0) return null;
  return candidates.reduce((farthest, tile) =>
    tileDistance(tile, targetTile) > tileDistance(farthest, targetTile) ? tile : farthest
  );
};

// Picks a free neighbor tile matching one of `preferredTileNames`, if any is
// reachable (falling back to the full candidate pool otherwise). Among that
// pool, the tile closest to `targetTile` is picked when given (Wardens still
// lean toward the enemy while favoring their terrain); otherwise a random
// one. Returns null if boxed in.
export const getPreferredNeighborTile = <T extends Avatar>(
  originTile: { id: number; positionX: number; positionZ: number },
  avatars: T[],
  tiles: Tile[],
  preferredTileNames: string[],
  targetTile?: { positionX: number; positionZ: number } | null,
  avoidTileId?: number
): Tile | null => {
  const candidates = getFreeNeighborTiles(originTile, avatars, tiles, avoidTileId);
  if (candidates.length === 0) return null;
  const preferred = candidates.filter((tile) => preferredTileNames.includes(tile.tileName));
  const pool = preferred.length > 0 ? preferred : candidates;
  if (!targetTile) return pool[Math.floor(Math.random() * pool.length)] ?? null;
  return pool.reduce((closest, tile) =>
    tileDistance(tile, targetTile) < tileDistance(closest, targetTile) ? tile : closest
  );
};
