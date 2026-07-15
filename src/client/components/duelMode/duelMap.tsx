import { useLoader } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { duelMapTilesData as initialMapTilesData } from './duelMapTilesData';
import { MapCanvas } from '../shared/MapCanvas';
import { MapTiles } from '../shared/MapTiles';
import { Avatars } from '../shared/Avatars';
import type { DuelMapProps } from '../../../shared/types/duelMap';
import type { TeamMember } from '../../../shared/types/team';
import { IMPASSABLE_TILE_NAME_PARTS } from '../../data/consts';
import {
  getAbilityTargetType,
  getAttackAbilityModifiers,
  getAttackAbilityTargetCount,
  getMoveAbilityRange,
  getPassiveMoveRangeBonus,
  isEndureActive,
  isHitAndRunPending,
} from '../../utils/abilities';
import { isNeighborTile } from '../../utils/adjacency';
import { getRandomFreeNeighborTile } from '../../utils/randomMove';
import { resolveAttack as resolveAttackBetween } from '../../utils/combat';

type MapTile = {
  id: number;
  positionX: number;
  positionZ: number;
  tileName: string;
};

// Breadth-first search from `originTile` up to `maxRange` steps, for
// movement abilities like Dash/Sprint/Dune Rush ("Move up to N tiles.").
// A tile only extends the search if it's itself passable and unoccupied —
// impassable terrain (and other avatars) block the path rather than just
// being invalid final destinations, so you can't hop over them to reach
// tiles beyond. A dead avatar no longer occupies its tile.
const getTilesReachableWithinRange = <
  T extends { id: number; tileID: number; statistics: { hp: number } },
>(
  originTile: MapTile,
  avatars: T[],
  tiles: MapTile[],
  maxRange: number
): Set<number> => {
  const occupiedTileIds = new Set(
    avatars
      .filter(
        (avatar) => avatar.tileID !== originTile.id && avatar.statistics.hp > 0
      )
      .map(({ tileID }) => tileID)
  );
  const isPassable = (tile: MapTile) =>
    !occupiedTileIds.has(tile.id) &&
    !IMPASSABLE_TILE_NAME_PARTS.some((part) => tile.tileName.includes(part));

  const visited = new Set<number>([originTile.id]);
  let frontier = [originTile];
  for (let step = 0; step < maxRange; step++) {
    const nextFrontier: MapTile[] = [];
    for (const tile of frontier) {
      for (const neighbor of tiles) {
        if (visited.has(neighbor.id) || !isNeighborTile(neighbor, tile)) continue;
        if (!isPassable(neighbor)) continue;
        visited.add(neighbor.id);
        nextFrontier.push(neighbor);
      }
    }
    frontier = nextFrontier;
  }
  visited.delete(originTile.id);
  return visited;
};

export const DuelMap = ({
  tiles,
  selectedTileName,
  team,
  enemyTeam,
  activeAvatarId,
  isMoveMode,
  isAttackMode,
  selectedAbilityName,
  isEnemyTurn,
  actionEvent,
  onActionEvent,
  onMoveAvatarToTile,
  onAttackTile,
  onUseAbility,
  onUseAttackAbility,
  onHitAndRunMove,
  onUseMoveAbility,
}: DuelMapProps) => {
  const [pendingAttackTargetIds, setPendingAttackTargetIds] = useState<
    number[]
  >([]);

  const allAvatars = useMemo(() => [...team, ...enemyTeam], [team, enemyTeam]);

  useMemo(() => {
    allAvatars.forEach(({ objectName }) =>
      useLoader.preload(GLTFLoader, `/assets/characters/${objectName}.glb`)
    );
  }, [allAvatars]);

  const activeAvatar = useMemo(
    () => team.find(({ id }) => id === activeAvatarId) ?? null,
    [team, activeAvatarId]
  );

  const activeTile = useMemo(() => {
    if (!activeAvatar) return null;
    return tiles.find((tile) => tile.id === activeAvatar.tileID) ?? null;
  }, [tiles, activeAvatar]);

  const selectedAbility = useMemo(() => {
    if (!selectedAbilityName || !activeAvatar) return null;
    return (
      activeAvatar.abilities.active.find(
        ({ name }) => name === selectedAbilityName
      ) ?? null
    );
  }, [selectedAbilityName, activeAvatar]);

  // Multi-target attack abilities (e.g. Cleave, "Attack two enemies.") are
  // picked one click at a time; reset the picks whenever the selected
  // ability changes (including cancellation). Adjusting state during render
  // (rather than in an effect) avoids an extra commit — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [prevSelectedAbilityName, setPrevSelectedAbilityName] = useState(
    selectedAbilityName
  );
  if (selectedAbilityName !== prevSelectedAbilityName) {
    setPrevSelectedAbilityName(selectedAbilityName);
    setPendingAttackTargetIds([]);
  }

  const dimmedTileIds = useMemo(() => {
    if (!activeTile) return new Set<number>();

    if (isMoveMode) {
      // Base range is 1 tile; Solid Ground adds +1 while standing on Dirt.
      // Uses the same BFS as move abilities so the extra tile is blocked by
      // impassable terrain/occupied tiles the same way.
      const moveRangeBonus = activeAvatar
        ? getPassiveMoveRangeBonus(activeAvatar, activeTile.tileName)
        : 0;
      const reachableTileIds = getTilesReachableWithinRange(
        activeTile,
        allAvatars,
        tiles,
        1 + moveRangeBonus
      );
      const ids = tiles
        .filter((tile) => !reachableTileIds.has(tile.id))
        .map((tile) => tile.id);
      return new Set(ids);
    }

    if (isAttackMode) {
      const enemyTileIds = new Set(
        enemyTeam
          .filter(({ statistics }) => statistics.hp > 0)
          .map(({ tileID }) => tileID)
      );
      const ids = tiles
        .filter((tile) => {
          if (tile.id === activeTile.id) return false;
          return !(
            enemyTileIds.has(tile.id) && isNeighborTile(tile, activeTile)
          );
        })
        .map((tile) => tile.id);
      return new Set(ids);
    }

    if (selectedAbility) {
      const moveRange = getMoveAbilityRange(selectedAbility);
      if (moveRange !== null) {
        const reachableTileIds = getTilesReachableWithinRange(
          activeTile,
          allAvatars,
          tiles,
          moveRange
        );
        const ids = tiles
          .filter((tile) => !reachableTileIds.has(tile.id))
          .map((tile) => tile.id);
        return new Set(ids);
      }

      const targetType = getAbilityTargetType(selectedAbility);

      if (targetType === 'enemy') {
        const enemyTileIds = new Set(
          enemyTeam
            .filter(
              ({ id: enemyId, statistics }) =>
                statistics.hp > 0 && !pendingAttackTargetIds.includes(enemyId)
            )
            .map(({ tileID }) => tileID)
        );
        // 'attack'-category abilities are a normal attack with a twist — same
        // adjacency requirement as a plain attack. 'reduce' abilities (Taunt,
        // Sandstorm, ...) have range.
        const requiresAdjacency = selectedAbility.category === 'attack';
        const ids = tiles
          .filter(
            (tile) =>
              !enemyTileIds.has(tile.id) ||
              (requiresAdjacency && !isNeighborTile(tile, activeTile))
          )
          .map((tile) => tile.id);
        return new Set(ids);
      }

      if (targetType === 'ally') {
        const allyTileIds = new Set(
          team
            .filter(({ statistics }) => statistics.hp > 0)
            .map(({ tileID }) => tileID)
        );
        const ids = tiles
          .filter((tile) => !allyTileIds.has(tile.id))
          .map((tile) => tile.id);
        return new Set(ids);
      }

      const ids = tiles
        .filter((tile) => tile.id !== activeTile.id)
        .map((tile) => tile.id);
      return new Set(ids);
    }

    return new Set<number>();
  }, [
    tiles,
    isMoveMode,
    isAttackMode,
    selectedAbility,
    activeTile,
    activeAvatar,
    allAvatars,
    team,
    enemyTeam,
    pendingAttackTargetIds,
  ]);

  // Shared by plain attacks and 'attack'-category abilities: resolves tile
  // bonuses, protector redirection, passive bonuses and the dodge/accuracy
  // roll for one attacker/target pair. `modifiers` lets an attack ability
  // bend the roll per its own description (damage multiplier, guaranteed
  // hit) without duplicating the whole calculation.
  const resolveAttack = (
    attackerAvatar: TeamMember,
    clickedTarget: TeamMember,
    modifiers: {
      damageMultiplier?: number;
      ignoreDodge?: boolean;
      ignoreMiss?: boolean;
    } = {}
  ) => resolveAttackBetween(attackerAvatar, clickedTarget, team, enemyTeam, tiles, modifiers);

  // Hit and Run: if the attacker has it pending, consume it by moving them
  // to a random free adjacent tile right after their attack resolves
  // (regardless of hit/dodge/miss). No-op if they're boxed in — the pending
  // flag is still cleared either way via onHitAndRunMove.
  const triggerHitAndRunIfPending = (attackerAvatar: TeamMember) => {
    if (!isHitAndRunPending(attackerAvatar)) return;
    const originTile = tiles.find((tile) => tile.id === attackerAvatar.tileID);
    const destination = originTile
      ? getRandomFreeNeighborTile(originTile, allAvatars, tiles)
      : null;
    onHitAndRunMove(attackerAvatar.id, destination?.id ?? null);
  };

  const handleTileClick = (id: number) => {
    if (isEnemyTurn || !activeTile) return;

    if (selectedAbilityName && selectedAbility) {
      if (activeAvatarId === null) return;

      const moveRange = getMoveAbilityRange(selectedAbility);
      if (moveRange !== null) {
        const reachableTileIds = getTilesReachableWithinRange(
          activeTile,
          allAvatars,
          tiles,
          moveRange
        );
        if (!reachableTileIds.has(id)) return;
        onUseMoveAbility(activeAvatarId, selectedAbilityName, id);
        return;
      }

      const targetType = getAbilityTargetType(selectedAbility);

      if (targetType === 'enemy') {
        const targetAvatar = enemyTeam.find(
          ({ tileID, statistics }) => tileID === id && statistics.hp > 0
        );
        if (!targetAvatar) return;

        if (selectedAbility.category === 'attack' && activeAvatar) {
          const targetTile = tiles.find((tile) => tile.id === id);
          if (!targetTile || !isNeighborTile(targetTile, activeTile)) return;
          if (pendingAttackTargetIds.includes(targetAvatar.id)) return;

          const targetCount = getAttackAbilityTargetCount(selectedAbility);
          const nextTargetIds = [...pendingAttackTargetIds, targetAvatar.id];
          const hasMoreLivingTargets = enemyTeam.some(
            ({ id: enemyId, statistics }) =>
              statistics.hp > 0 && !nextTargetIds.includes(enemyId)
          );

          if (nextTargetIds.length < targetCount && hasMoreLivingTargets) {
            setPendingAttackTargetIds(nextTargetIds);
            return;
          }

          const modifiers = getAttackAbilityModifiers(selectedAbility);
          const results = nextTargetIds
            .map((targetId) =>
              enemyTeam.find(({ id: enemyId }) => enemyId === targetId)
            )
            .filter((member): member is TeamMember => !!member)
            .map((member) => resolveAttack(activeAvatar, member, modifiers))
            .filter((result): result is NonNullable<typeof result> => !!result);

          const last = results[results.length - 1];
          if (!last) {
            setPendingAttackTargetIds([]);
            return;
          }

          onActionEvent({
            kind: 'attack',
            attackerId: activeAvatarId,
            targetId: last.targetAvatar.id,
            targetX: last.targetTile.positionX,
            targetZ: last.targetTile.positionZ,
            damage: last.damage,
            outcome: last.outcome,
            isDead:
              last.outcome === 'hit' &&
              !isEndureActive(last.targetAvatar) &&
              last.targetAvatar.statistics.hp - last.damage <= 0,
          });
          onUseAttackAbility(
            activeAvatarId,
            selectedAbilityName,
            results.map((result) => ({
              targetId: result.targetAvatar.id,
              damage: result.damage,
              outcome: result.outcome,
            }))
          );
          triggerHitAndRunIfPending(activeAvatar);
          setPendingAttackTargetIds([]);
          return;
        }

        onActionEvent({
          kind: 'ability',
          casterId: activeAvatarId,
          targetId: targetAvatar.id,
          label: selectedAbilityName,
        });
        onUseAbility(activeAvatarId, selectedAbilityName, targetAvatar.id);
        return;
      }

      if (targetType === 'ally') {
        const targetAvatar = team.find(
          ({ tileID, statistics }) => tileID === id && statistics.hp > 0
        );
        if (!targetAvatar) return;
        onActionEvent({
          kind: 'ability',
          casterId: activeAvatarId,
          targetId: targetAvatar.id,
          label: selectedAbilityName,
        });
        onUseAbility(activeAvatarId, selectedAbilityName, targetAvatar.id);
        return;
      }

      if (id !== activeTile.id) return;
      onActionEvent({
        kind: 'ability',
        casterId: activeAvatarId,
        targetId: activeAvatarId,
        label: selectedAbilityName,
      });
      onUseAbility(activeAvatarId, selectedAbilityName, activeAvatarId);
      return;
    }

    if (id === activeTile.id || dimmedTileIds.has(id)) return;

    if (isMoveMode) {
      onMoveAvatarToTile(id);
      return;
    }

    if (isAttackMode && activeAvatarId !== null) {
      const clickedTarget = enemyTeam.find(({ tileID }) => tileID === id);
      const attackerAvatar = allAvatars.find(({ id }) => id === activeAvatarId);
      if (!clickedTarget || !attackerAvatar) return;

      const result = resolveAttack(attackerAvatar, clickedTarget);
      if (!result) return;
      const { targetAvatar, targetTile, damage, outcome } = result;

      onActionEvent({
        kind: 'attack',
        attackerId: activeAvatarId,
        targetId: targetAvatar.id,
        targetX: targetTile.positionX,
        targetZ: targetTile.positionZ,
        damage,
        outcome,
        isDead:
          outcome === 'hit' &&
          !isEndureActive(targetAvatar) &&
          targetAvatar.statistics.hp - damage <= 0,
      });
      onAttackTile(activeAvatarId, targetAvatar.id, damage, outcome);
      triggerHitAndRunIfPending(attackerAvatar);
    }
  };

  return (
    <MapCanvas>
      <MapTiles
        tiles={tiles}
        onTileClick={handleTileClick}
        dimmedTileIds={dimmedTileIds}
      />
      <Avatars team={allAvatars} tiles={tiles} actionEvent={actionEvent} />
    </MapCanvas>
  );
};
