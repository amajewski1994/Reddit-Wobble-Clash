import { useLoader } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { duelMapTilesData as initialMapTilesData } from './duelMapTilesData';
import { userTeam, enemyTeam } from './teamsDate';
import { MapCanvas } from '../shared/MapCanvas';
import { MapTiles } from '../shared/MapTiles';
import { Avatars } from '../shared/Avatars';
import type { DuelMapProps } from '../../types/duelMap';

const AVATAR_PATHS = [...userTeam, ...enemyTeam].map(({ name }) => `/assets/characters/${name}.glb`);

AVATAR_PATHS.forEach((path) => useLoader.preload(GLTFLoader, path));

const NEIGHBOR_DISTANCE_THRESHOLD = 1.1;
const IMPASSABLE_TILE_NAME_PARTS = ['hill', 'mountain'];

const isNeighborTile = (
  tile: { positionX: number; positionZ: number },
  origin: { positionX: number; positionZ: number }
) => {
  const dx = tile.positionX - origin.positionX;
  const dz = tile.positionZ - origin.positionZ;
  return Math.sqrt(dx * dx + dz * dz) <= NEIGHBOR_DISTANCE_THRESHOLD;
};

export const DuelMap = ({
  selectedTileName,
  team,
  enemyTeam,
  activeAvatarId,
  isMoveMode,
  isAttackMode,
  onMoveAvatarToTile,
  onAttackTile,
}: DuelMapProps) => {
  const [tiles, setTiles] = useState(initialMapTilesData);
  const [attackEvent, setAttackEvent] = useState<{
    attackerId: number;
    targetId: number;
    targetX: number;
    targetZ: number;
    damage: number;
    isDead: boolean;
  } | null>(null);

  const allAvatars = useMemo(() => [...team, ...enemyTeam], [team, enemyTeam]);

  const activeTile = useMemo(() => {
    const activeAvatar = team.find(({ id }) => id === activeAvatarId);
    if (!activeAvatar) return null;
    return tiles.find((tile) => tile.id === activeAvatar.tileID) ?? null;
  }, [tiles, team, activeAvatarId]);

  const dimmedTileIds = useMemo(() => {
    if (!activeTile) return new Set<number>();

    if (isMoveMode) {
      const occupiedTileIds = new Set(
        allAvatars.filter(({ id }) => id !== activeAvatarId).map(({ tileID }) => tileID)
      );
      const ids = tiles
        .filter((tile) => {
          if (tile.id === activeTile.id) return false;
          if (occupiedTileIds.has(tile.id)) return true;
          if (IMPASSABLE_TILE_NAME_PARTS.some((part) => tile.tileName.includes(part))) return true;
          return !isNeighborTile(tile, activeTile);
        })
        .map((tile) => tile.id);
      return new Set(ids);
    }

    if (isAttackMode) {
      const enemyTileIds = new Set(
        enemyTeam.filter(({ hp }) => hp > 0).map(({ tileID }) => tileID)
      );
      const ids = tiles
        .filter((tile) => {
          if (tile.id === activeTile.id) return false;
          return !(enemyTileIds.has(tile.id) && isNeighborTile(tile, activeTile));
        })
        .map((tile) => tile.id);
      return new Set(ids);
    }

    return new Set<number>();
  }, [tiles, isMoveMode, isAttackMode, activeTile, allAvatars, activeAvatarId, enemyTeam]);

  const handleTileClick = (id: number) => {
    if (!activeTile || id === activeTile.id || dimmedTileIds.has(id)) return;

    if (isMoveMode) {
      onMoveAvatarToTile(id);
      return;
    }

    if (isAttackMode && activeAvatarId !== null) {
      const targetTile = tiles.find((tile) => tile.id === id);
      const targetAvatar = enemyTeam.find(({ tileID }) => tileID === id);
      const attackerAvatar = allAvatars.find(({ id }) => id === activeAvatarId);
      if (!targetTile || !targetAvatar || !attackerAvatar) return;
      const damage = attackerAvatar.attack - targetAvatar.defence;
      setAttackEvent({
        attackerId: activeAvatarId,
        targetId: targetAvatar.id,
        targetX: targetTile.positionX,
        targetZ: targetTile.positionZ,
        damage,
        isDead: targetAvatar.hp - damage <= 0,
      });
      onAttackTile(activeAvatarId, targetAvatar.id);
    }
  };

  return (
    <MapCanvas>
      <MapTiles tiles={tiles} onTileClick={handleTileClick} dimmedTileIds={dimmedTileIds} />
      <Avatars team={allAvatars} tiles={tiles} attackEvent={attackEvent} />
    </MapCanvas>
  );
};
