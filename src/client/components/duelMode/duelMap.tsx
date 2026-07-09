import { useLoader } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { duelMapTilesData as initialMapTilesData } from './duelMapTilesData';
import { userTeam, enemyTeam } from './teamsDate';
import { MapCanvas } from '../shared/MapCanvas';
import { MapTiles } from '../shared/MapTiles';
import { Avatars } from '../shared/Avatars';
import type { AttackOutcome, DuelMapProps } from '../../types/duelMap';
import type { TeamMemberTileStatistics } from '../../types/team';

const AVATAR_PATHS = [...userTeam, ...enemyTeam].map(({ name }) => `/assets/characters/${name}.glb`);

AVATAR_PATHS.forEach((path) => useLoader.preload(GLTFLoader, path));

const NEIGHBOR_DISTANCE_THRESHOLD = 1.1;
const IMPASSABLE_TILE_NAME_PARTS = ['hill', 'mountain'];

const TILE_BP_KEY_BY_NAME_PART: Record<string, keyof TeamMemberTileStatistics> = {
  grass: 'grassBP',
  sand: 'sandBP',
  stone: 'stoneBP',
  dirt: 'dirtBP',
  forest: 'forestBP',
  desert: 'desertBP',
  rocks: 'rocksBP',
};

const getTileBPBonus = (tileName: string, tileBP: TeamMemberTileStatistics) =>
  tileName.split('-').reduce((sum, part) => {
    const key = TILE_BP_KEY_BY_NAME_PART[part];
    return key ? sum + (tileBP[key] ?? 0) : sum;
  }, 0);

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
    outcome: AttackOutcome;
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
        enemyTeam.filter(({ statistics }) => statistics.hp > 0).map(({ tileID }) => tileID)
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
      const attackerTile = tiles.find((tile) => tile.id === attackerAvatar?.tileID);
      if (!targetTile || !targetAvatar || !attackerAvatar || !attackerTile) return;

      const attackBonus = getTileBPBonus(attackerTile.tileName, attackerAvatar.statistics.tileBP);
      const defenceBonus = getTileBPBonus(targetTile.tileName, targetAvatar.statistics.tileBP);

      const randomDodge = Math.random() * 100;
      const randomAccuracy = Math.random() * 100;
      const outcome: AttackOutcome =
        randomDodge < targetAvatar.statistics.dodge
          ? 'dodge'
          : randomAccuracy > attackerAvatar.statistics.accuracy
            ? 'miss'
            : 'hit';
      const damage =
        outcome === 'hit'
          ? attackerAvatar.statistics.attack + attackBonus - (targetAvatar.statistics.defence + defenceBonus)
          : 0;

      setAttackEvent({
        attackerId: activeAvatarId,
        targetId: targetAvatar.id,
        targetX: targetTile.positionX,
        targetZ: targetTile.positionZ,
        damage,
        outcome,
        isDead: outcome === 'hit' && targetAvatar.statistics.hp - damage <= 0,
      });
      onAttackTile(activeAvatarId, targetAvatar.id, damage, outcome);
    }
  };

  return (
    <MapCanvas>
      <MapTiles tiles={tiles} onTileClick={handleTileClick} dimmedTileIds={dimmedTileIds} />
      <Avatars team={allAvatars} tiles={tiles} attackEvent={attackEvent} />
    </MapCanvas>
  );
};
