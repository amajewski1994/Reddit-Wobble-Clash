import { useLoader } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { duelMapTilesData as initialMapTilesData } from './duelMapTilesData';
import { MapCanvas } from '../shared/MapCanvas';
import { MapTiles } from '../shared/MapTiles';
import { Avatars } from '../shared/Avatars';
import type {
  AttackOutcome,
  DuelActionEvent,
  DuelMapProps,
} from '../../types/duelMap';
import type { TeamMember } from '../../types/team';
import { IMPASSABLE_TILE_NAME_PARTS } from '../../data/consts';
import {
  findProtector,
  getAbilityTargetType,
  getAttackAbilityModifiers,
  getAttackAbilityTargetCount,
  getCrushingBlowsMultiplier,
  getEffectiveBonus,
  getMoveAbilityRange,
  getOwnPassiveDefenceBonus,
  getPassiveAllyAttackBonus,
  getPassiveAttackBonus,
  getPassiveDefenceBonus,
  getPassiveDodgeBonus,
  getPassiveMoveRangeBonus,
  getStatModifierTotal,
  isDamageImmune,
  isEndureActive,
  isHitAndRunPending,
  isIgnoringEnemyDodgeBonuses,
} from '../../utils/abilities';
import { getTileBPBonus } from '../../utils/tileBonus';
import { isNeighborTile } from '../../utils/adjacency';

// Picks a random passable, unoccupied tile adjacent to `originTile` — the
// same validity rules as a normal move (see the isMoveMode branch of
// dimmedTileIds below). Returns null if the attacker is boxed in.
const getRandomFreeNeighborTile = <T extends { id: number; tileID: number }>(
  originTile: { id: number; positionX: number; positionZ: number },
  avatars: T[],
  tiles: { id: number; positionX: number; positionZ: number; tileName: string }[]
) => {
  const occupiedTileIds = new Set(avatars.map(({ tileID }) => tileID));
  const candidates = tiles.filter(
    (tile) =>
      tile.id !== originTile.id &&
      isNeighborTile(tile, originTile) &&
      !occupiedTileIds.has(tile.id) &&
      !IMPASSABLE_TILE_NAME_PARTS.some((part) => tile.tileName.includes(part))
  );
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return chosen ?? null;
};

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
// tiles beyond.
const getTilesReachableWithinRange = <T extends { id: number; tileID: number }>(
  originTile: MapTile,
  avatars: T[],
  tiles: MapTile[],
  maxRange: number
): Set<number> => {
  const occupiedTileIds = new Set(
    avatars.filter((avatar) => avatar.tileID !== originTile.id).map(({ tileID }) => tileID)
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
  selectedTileName,
  team,
  enemyTeam,
  activeAvatarId,
  isMoveMode,
  isAttackMode,
  selectedAbilityName,
  onMoveAvatarToTile,
  onAttackTile,
  onUseAbility,
  onUseAttackAbility,
  onHitAndRunMove,
  onUseMoveAbility,
}: DuelMapProps) => {
  const [tiles, setTiles] = useState(initialMapTilesData);
  const [actionEvent, setActionEvent] = useState<DuelActionEvent | null>(
    null
  );
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
        const ids = tiles
          .filter((tile) => !enemyTileIds.has(tile.id))
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
  ) => {
    const targetTile = tiles.find((tile) => tile.id === clickedTarget.tileID);
    const attackerTile = tiles.find(
      (tile) => tile.id === attackerAvatar.tileID
    );
    if (!targetTile || !attackerTile) return null;

    const clickedTargetTeam = enemyTeam.some(
      ({ id }) => id === clickedTarget.id
    )
      ? enemyTeam
      : team;
    const protector = findProtector(
      clickedTarget,
      clickedTargetTeam,
      (member) => {
        const protectorTile = tiles.find((tile) => tile.id === member.tileID);
        return !!protectorTile && isNeighborTile(protectorTile, targetTile);
      }
    );
    const targetAvatar = protector ?? clickedTarget;
    const defenderTile = protector
      ? (tiles.find((tile) => tile.id === protector.tileID) ?? targetTile)
      : targetTile;

    const attackerIsPlayer = team.some(({ id }) => id === attackerAvatar.id);
    const attackerOpposingTeam = attackerIsPlayer ? enemyTeam : team;
    const attackerOwnTeam = attackerIsPlayer ? team : enemyTeam;

    const attackBonus = getEffectiveBonus(
      getTileBPBonus(attackerTile.tileName, attackerAvatar.statistics.tileBP),
      attackerAvatar
    );
    const defenceBonus =
      getEffectiveBonus(
        getTileBPBonus(defenderTile.tileName, targetAvatar.statistics.tileBP),
        targetAvatar
      ) +
      getStatModifierTotal(
        targetAvatar,
        'defence',
        targetAvatar.statistics.defence
      ) +
      getEffectiveBonus(
        getPassiveDefenceBonus(targetAvatar, clickedTargetTeam, (ally) => {
          const allyTile = tiles.find((tile) => tile.id === ally.tileID);
          return !!allyTile && isNeighborTile(allyTile, defenderTile);
        }),
        targetAvatar
      ) +
      getEffectiveBonus(
        getOwnPassiveDefenceBonus(targetAvatar, defenderTile.tileName),
        targetAvatar
      );
    const attackBoostBonus = getStatModifierTotal(
      attackerAvatar,
      'attack',
      attackerAvatar.statistics.attack
    );
    const passiveBonus = getEffectiveBonus(
      getPassiveAttackBonus(
        attackerAvatar,
        attackerOpposingTeam,
        attackerTile.tileName
      ),
      attackerAvatar
    );
    const allyAttackBonus = getEffectiveBonus(
      getPassiveAllyAttackBonus(attackerAvatar, attackerOwnTeam, (ally) => {
        const allyTile = tiles.find((tile) => tile.id === ally.tileID);
        return !!allyTile && isNeighborTile(allyTile, attackerTile);
      }),
      attackerAvatar
    );

    const effectiveAccuracy =
      attackerAvatar.statistics.accuracy +
      getStatModifierTotal(
        attackerAvatar,
        'accuracy',
        attackerAvatar.statistics.accuracy
      );

    const ignoresTargetDodgeBonuses = isIgnoringEnemyDodgeBonuses(attackerAvatar);
    const targetDodgeBonus = ignoresTargetDodgeBonuses
      ? 0
      : getStatModifierTotal(
          targetAvatar,
          'dodge',
          targetAvatar.statistics.dodge
        ) +
        getEffectiveBonus(
          getPassiveDodgeBonus(targetAvatar, defenderTile.tileName),
          targetAvatar
        );
    const effectiveDodge = targetAvatar.statistics.dodge + targetDodgeBonus;

    const randomDodge = Math.random() * 100;
    const randomAccuracy = Math.random() * 100;
    const outcome: AttackOutcome =
      !modifiers.ignoreDodge && randomDodge < effectiveDodge
        ? 'dodge'
        : !modifiers.ignoreMiss && randomAccuracy > effectiveAccuracy
          ? 'miss'
          : 'hit';

    const offense =
      (attackerAvatar.statistics.attack +
        attackBonus +
        attackBoostBonus +
        passiveBonus +
        allyAttackBonus) *
      (modifiers.damageMultiplier ?? 1) *
      getCrushingBlowsMultiplier(attackerAvatar);
    const damage =
      outcome === 'hit' && !isDamageImmune(targetAvatar)
        ? Math.round(offense) - (targetAvatar.statistics.defence + defenceBonus)
        : 0;

    return { targetAvatar, targetTile, damage, outcome };
  };

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
    if (!activeTile) return;

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

          setActionEvent({
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

        setActionEvent({
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
        setActionEvent({
          kind: 'ability',
          casterId: activeAvatarId,
          targetId: targetAvatar.id,
          label: selectedAbilityName,
        });
        onUseAbility(activeAvatarId, selectedAbilityName, targetAvatar.id);
        return;
      }

      if (id !== activeTile.id) return;
      setActionEvent({
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

      setActionEvent({
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
