import { useEffect, useRef } from 'react';
import type { TeamMember } from '../../types/team';
import type { AttackOutcome, DuelActionEvent } from '../../types/duelMap';
import type { ActiveAbility, AbilityCategory } from '../../types/characters';
import { duelMapTilesData } from './duelMapTilesData';
import { characters } from '../../data/characters';
import {
  getNeighborTileAwayFrom,
  getNeighborTileTowards,
  getPreferredNeighborTile,
  getRandomFreeNeighborTile,
} from '../../utils/randomMove';
import { resolveAttack } from '../../utils/combat';
import { isNeighborTile } from '../../utils/adjacency';
import { getMaxHp } from '../../utils/maxHp';
import {
  getAbilityTargetType,
  getAttackAbilityModifiers,
  getAttackAbilityTargetCount,
  getMoveAbilityRange,
  isEndureActive,
} from '../../utils/abilities';

const MOVE_DELAY_MS = 2000;

type EnemyTurnProps = {
  isEnemyTurn: boolean;
  team: TeamMember[];
  enemyTeam: TeamMember[];
  onMoveEnemy: (enemyId: number, tileId: number) => void;
  onAttackTile: (
    attackerId: number,
    targetId: number,
    damage: number,
    outcome: AttackOutcome
  ) => void;
  onUseAbility: (casterId: number, abilityName: string, targetId: number) => void;
  onUseAttackAbility: (
    casterId: number,
    abilityName: string,
    results: { targetId: number; damage: number; outcome: AttackOutcome }[]
  ) => void;
  onActionEvent: (event: DuelActionEvent | null) => void;
  onEnemyTurnEnd: () => void;
};

// Each class leans on a different tactic:
// - seekContact (Warrior, Guardian, Champion): close the distance to the
//   nearest opponent instead of wandering randomly.
// - keepDistance (Healer, Support): retreat from the nearest opponent, and
//   reach for a buff/heal before risking melee.
// - terrainSeeker (the Wardens): head for their favored terrain when there's
//   nothing better to do, leaning toward the nearest opponent among tiles of
//   that terrain.
// - neutral (Sharpshooter, Nimble, Runner, Veteran, Adventurer): the default
//   priority order; same as seekContact once it falls back to moving.
type Archetype = 'seekContact' | 'keepDistance' | 'terrainSeeker' | 'neutral';

const ARCHETYPE_BY_CLASS: Record<string, Archetype> = {
  Warrior: 'seekContact',
  Guardian: 'seekContact',
  Champion: 'seekContact',
  Healer: 'keepDistance',
  Support: 'keepDistance',
  'Grass Warden': 'terrainSeeker',
  'Sand Warden': 'terrainSeeker',
  'Stone Warden': 'terrainSeeker',
  'Dirt Warden': 'terrainSeeker',
  'Rock Warden': 'terrainSeeker',
};

const TERRAIN_PREFERENCE_BY_CLASS: Record<string, string[]> = {
  'Grass Warden': ['grass', 'grass-forest'],
  'Sand Warden': ['sand', 'sand-desert', 'sand-rocks'],
  'Stone Warden': ['stone', 'stone-rocks'],
  'Dirt Warden': ['dirt', 'dirt-lumber'],
  'Rock Warden': ['sand-rocks', 'stone-rocks'],
};

const getClassName = (member: TeamMember): string | undefined =>
  characters.find(({ id }) => id === member.characterId)?.class;

const getArchetype = (member: TeamMember): Archetype => {
  const className = getClassName(member);
  return (className && ARCHETYPE_BY_CLASS[className]) || 'neutral';
};

// Move-range abilities (Dash/Sprint/Dune Rush) need the same pathfinding as
// a player's move — skip those here and let the move fallback handle
// positioning; this only considers abilities with a fixed self/ally/enemy
// target.
const isCastableAbility = (actor: TeamMember, ability: ActiveAbility) =>
  (actor.abilityCooldowns[ability.name] ?? 0) === 0 &&
  getMoveAbilityRange(ability) === null;

const findUsableAbility = (
  actor: TeamMember,
  category: AbilityCategory
): ActiveAbility | undefined =>
  actor.abilities.active.find(
    (ability) => ability.category === category && isCastableAbility(actor, ability)
  );

const pickRandomTargets = <T,>(pool: T[], count: number): T[] => {
  const remaining = [...pool];
  const picked: T[] = [];
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const index = Math.floor(Math.random() * remaining.length);
    picked.push(remaining.splice(index, 1)[0]!);
  }
  return picked;
};

const findNearestOpponentTile = (
  originTile: { positionX: number; positionZ: number },
  opponents: TeamMember[]
) => {
  let nearestTile: (typeof duelMapTilesData)[number] | null = null;
  let nearestDistance = Infinity;
  for (const opponent of opponents) {
    if (opponent.statistics.hp <= 0) continue;
    const tile = duelMapTilesData.find(({ id }) => id === opponent.tileID);
    if (!tile) continue;
    const distance = Math.hypot(
      tile.positionX - originTile.positionX,
      tile.positionZ - originTile.positionZ
    );
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestTile = tile;
    }
  }
  return nearestTile;
};

// Headless controller: while isEnemyTurn is true, walks the enemy roster one
// member at a time — each spends its own AP one action per second, before
// the next member starts. Every member tries heal, then a ranged attack
// ability, then (unless it's a keepDistance class) melee, then a debuff
// ability, then a buff, then a self-utility ability, in that order; whoever
// still has nothing to do falls back to a class-flavored move. Hands the
// turn back via onEnemyTurnEnd once every enemy is out of AP. Renders
// nothing.
export const EnemyTurn = ({
  isEnemyTurn,
  team,
  enemyTeam,
  onMoveEnemy,
  onAttackTile,
  onUseAbility,
  onUseAttackAbility,
  onActionEvent,
  onEnemyTurnEnd,
}: EnemyTurnProps) => {
  const teamRef = useRef(team);
  const enemyTeamRef = useRef(enemyTeam);
  const onMoveEnemyRef = useRef(onMoveEnemy);
  const onAttackTileRef = useRef(onAttackTile);
  const onUseAbilityRef = useRef(onUseAbility);
  const onUseAttackAbilityRef = useRef(onUseAttackAbility);
  const onActionEventRef = useRef(onActionEvent);
  const onEnemyTurnEndRef = useRef(onEnemyTurnEnd);
  // Tile each enemy stood on right before its last move, so it doesn't just
  // shuffle back and forth between the same two tiles.
  const previousTileByEnemyId = useRef(new Map<number, number>());

  // Runs after every render (no dependency array) so the refs the step loop
  // reads from setTimeout are always current, without retriggering the
  // isEnemyTurn effect below.
  useEffect(() => {
    teamRef.current = team;
    enemyTeamRef.current = enemyTeam;
    onMoveEnemyRef.current = onMoveEnemy;
    onAttackTileRef.current = onAttackTile;
    onUseAbilityRef.current = onUseAbility;
    onUseAttackAbilityRef.current = onUseAttackAbility;
    onActionEventRef.current = onActionEvent;
    onEnemyTurnEndRef.current = onEnemyTurnEnd;
  });

  useEffect(() => {
    if (!isEnemyTurn) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const step = () => {
      if (cancelled) return;

      const actingEnemy = enemyTeamRef.current.find(
        ({ statistics }) => statistics.hp > 0 && statistics.AP > 0
      );
      if (!actingEnemy) {
        onEnemyTurnEndRef.current();
        return;
      }

      const allies = enemyTeamRef.current;
      const opponents = teamRef.current;
      const livingOpponents = opponents.filter(({ statistics }) => statistics.hp > 0);
      const originTile = duelMapTilesData.find(
        (tile) => tile.id === actingEnemy.tileID
      );
      const archetype = getArchetype(actingEnemy);

      const tryHeal = (): boolean => {
        const healAbility = findUsableAbility(actingEnemy, 'heal');
        if (!healAbility) return false;
        const targetType = getAbilityTargetType(healAbility);
        const healTarget =
          targetType === 'self'
            ? actingEnemy.statistics.hp < getMaxHp(actingEnemy.id)
              ? actingEnemy
              : null
            : (allies.find(
                (ally) => ally.statistics.hp > 0 && ally.statistics.hp < getMaxHp(ally.id)
              ) ?? null);
        if (!healTarget) return false;
        onActionEventRef.current({
          kind: 'ability',
          casterId: actingEnemy.id,
          targetId: healTarget.id,
          label: healAbility.name,
        });
        onUseAbilityRef.current(actingEnemy.id, healAbility.name, healTarget.id);
        return true;
      };

      const tryAttackAbility = (): boolean => {
        const attackAbility = findUsableAbility(actingEnemy, 'attack');
        if (!attackAbility || !originTile) return false;
        // 'attack'-category abilities are a normal attack with a twist —
        // same adjacency requirement as a plain attack.
        const adjacentLivingOpponents = livingOpponents.filter((opponent) => {
          const opponentTile = duelMapTilesData.find(
            (tile) => tile.id === opponent.tileID
          );
          return !!opponentTile && isNeighborTile(opponentTile, originTile);
        });
        if (adjacentLivingOpponents.length === 0) return false;
        const targets = pickRandomTargets(
          adjacentLivingOpponents,
          getAttackAbilityTargetCount(attackAbility)
        );
        const modifiers = getAttackAbilityModifiers(attackAbility);
        const results = targets
          .map((target) =>
            resolveAttack(actingEnemy, target, opponents, allies, duelMapTilesData, modifiers)
          )
          .filter((result): result is NonNullable<typeof result> => !!result);
        if (results.length === 0) return false;
        const last = results[results.length - 1]!;
        onActionEventRef.current({
          kind: 'attack',
          attackerId: actingEnemy.id,
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
        onUseAttackAbilityRef.current(
          actingEnemy.id,
          attackAbility.name,
          results.map((result) => ({
            targetId: result.targetAvatar.id,
            damage: result.damage,
            outcome: result.outcome,
          }))
        );
        return true;
      };

      const tryMeleeAttack = (): boolean => {
        const neighborOpponent = originTile
          ? opponents.find(({ statistics, tileID }) => {
              if (statistics.hp <= 0) return false;
              const targetTile = duelMapTilesData.find((tile) => tile.id === tileID);
              return !!targetTile && isNeighborTile(targetTile, originTile);
            })
          : undefined;
        const result =
          originTile && neighborOpponent
            ? resolveAttack(actingEnemy, neighborOpponent, opponents, allies, duelMapTilesData)
            : null;
        if (!result) return false;
        onActionEventRef.current({
          kind: 'attack',
          attackerId: actingEnemy.id,
          targetId: result.targetAvatar.id,
          targetX: result.targetTile.positionX,
          targetZ: result.targetTile.positionZ,
          damage: result.damage,
          outcome: result.outcome,
          isDead:
            result.outcome === 'hit' &&
            !isEndureActive(result.targetAvatar) &&
            result.targetAvatar.statistics.hp - result.damage <= 0,
        });
        onAttackTileRef.current(
          actingEnemy.id,
          result.targetAvatar.id,
          result.damage,
          result.outcome
        );
        return true;
      };

      const tryReduceAbility = (): boolean => {
        const reduceAbility = findUsableAbility(actingEnemy, 'reduce');
        if (!reduceAbility || livingOpponents.length === 0) return false;
        const target =
          livingOpponents[Math.floor(Math.random() * livingOpponents.length)]!;
        onActionEventRef.current({
          kind: 'ability',
          casterId: actingEnemy.id,
          targetId: target.id,
          label: reduceAbility.name,
        });
        onUseAbilityRef.current(actingEnemy.id, reduceAbility.name, target.id);
        return true;
      };

      const tryBoostAbility = (): boolean => {
        const boostAbility = findUsableAbility(actingEnemy, 'boost');
        if (!boostAbility) return false;
        const targetType = getAbilityTargetType(boostAbility);
        const boostTargetId =
          targetType === 'self' || targetType === 'allies'
            ? actingEnemy.id
            : (allies.find(
                (ally) => ally.statistics.hp > 0 && ally.id !== actingEnemy.id
              )?.id ?? actingEnemy.id);
        onActionEventRef.current({
          kind: 'ability',
          casterId: actingEnemy.id,
          targetId: boostTargetId,
          label: boostAbility.name,
        });
        onUseAbilityRef.current(actingEnemy.id, boostAbility.name, boostTargetId);
        return true;
      };

      const trySelfUtilityAbility = (): boolean => {
        const utilityAbility = actingEnemy.abilities.active.find(
          (ability) =>
            ability.category === 'utility' &&
            isCastableAbility(actingEnemy, ability) &&
            getAbilityTargetType(ability) === 'self'
        );
        if (!utilityAbility) return false;
        onActionEventRef.current({
          kind: 'ability',
          casterId: actingEnemy.id,
          targetId: actingEnemy.id,
          label: utilityAbility.name,
        });
        onUseAbilityRef.current(actingEnemy.id, utilityAbility.name, actingEnemy.id);
        return true;
      };

      // Healer/Support lean on their kit rather than trading blows: try a
      // buff/heal-adjacent ability before risking melee, not after.
      const actionOrder =
        archetype === 'keepDistance'
          ? [tryHeal, tryAttackAbility, tryBoostAbility, tryMeleeAttack, tryReduceAbility, trySelfUtilityAbility]
          : [tryHeal, tryAttackAbility, tryMeleeAttack, tryReduceAbility, tryBoostAbility, trySelfUtilityAbility];

      for (const tryAction of actionOrder) {
        if (tryAction()) {
          timeoutId = setTimeout(step, MOVE_DELAY_MS);
          return;
        }
      }

      // Nothing to attack/cast: move, flavored by class. Avoid backtracking
      // onto the tile stood on before the last move whenever there's
      // another option.
      const allAvatars = [...opponents, ...allies];
      const avoidTileId = previousTileByEnemyId.current.get(actingEnemy.id);
      const destination = (() => {
        if (!originTile) return null;
        const nearestOpponentTile = findNearestOpponentTile(originTile, opponents);

        if (archetype === 'keepDistance') {
          return nearestOpponentTile
            ? getNeighborTileAwayFrom(
                originTile,
                allAvatars,
                duelMapTilesData,
                nearestOpponentTile,
                avoidTileId
              )
            : getRandomFreeNeighborTile(originTile, allAvatars, duelMapTilesData, avoidTileId);
        }

        if (archetype === 'terrainSeeker') {
          const className = getClassName(actingEnemy);
          const preferredTileNames = className
            ? (TERRAIN_PREFERENCE_BY_CLASS[className] ?? [])
            : [];
          return getPreferredNeighborTile(
            originTile,
            allAvatars,
            duelMapTilesData,
            preferredTileNames,
            nearestOpponentTile,
            avoidTileId
          );
        }

        // seekContact and neutral both close the distance to the nearest
        // opponent once there's nothing better to do.
        return nearestOpponentTile
          ? getNeighborTileTowards(
              originTile,
              allAvatars,
              duelMapTilesData,
              nearestOpponentTile,
              avoidTileId
            )
          : getRandomFreeNeighborTile(originTile, allAvatars, duelMapTilesData, avoidTileId);
      })();

      if (destination && originTile) {
        previousTileByEnemyId.current.set(actingEnemy.id, originTile.id);
      }

      onMoveEnemyRef.current(
        actingEnemy.id,
        destination?.id ?? actingEnemy.tileID
      );
      timeoutId = setTimeout(step, MOVE_DELAY_MS);
    };

    step();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isEnemyTurn]);

  return null;
};
