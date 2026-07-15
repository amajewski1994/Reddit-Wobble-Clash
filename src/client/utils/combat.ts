import type { TeamMember } from '../types/team';
import type { AttackOutcome } from '../types/duelMap';
import {
  findProtector,
  getCrushingBlowsMultiplier,
  getEffectiveBonus,
  getOwnPassiveDefenceBonus,
  getPassiveAllyAttackBonus,
  getPassiveAttackBonus,
  getPassiveDefenceBonus,
  getPassiveDodgeBonus,
  getStatModifierTotal,
  isDamageImmune,
  isIgnoringEnemyDodgeBonuses,
} from './abilities';
import { getTileBPBonus } from './tileBonus';
import { isNeighborTile } from './adjacency';

type MapTile = {
  id: number;
  positionX: number;
  positionZ: number;
  tileName: string;
};

// Shared by plain attacks and 'attack'-category abilities, for both player-
// and enemy-initiated attacks: resolves tile bonuses, protector redirection,
// passive bonuses and the dodge/accuracy roll for one attacker/target pair.
// `modifiers` lets an attack ability bend the roll per its own description
// (damage multiplier, guaranteed hit) without duplicating the whole
// calculation.
export const resolveAttack = (
  attackerAvatar: TeamMember,
  clickedTarget: TeamMember,
  team: TeamMember[],
  enemyTeam: TeamMember[],
  tiles: MapTile[],
  modifiers: {
    damageMultiplier?: number;
    ignoreDodge?: boolean;
    ignoreMiss?: boolean;
  } = {}
) => {
  const targetTile = tiles.find((tile) => tile.id === clickedTarget.tileID);
  const attackerTile = tiles.find((tile) => tile.id === attackerAvatar.tileID);
  if (!targetTile || !attackerTile) return null;

  const clickedTargetTeam = enemyTeam.some(({ id }) => id === clickedTarget.id)
    ? enemyTeam
    : team;
  const protector = findProtector(clickedTarget, clickedTargetTeam, (member) => {
    const protectorTile = tiles.find((tile) => tile.id === member.tileID);
    return !!protectorTile && isNeighborTile(protectorTile, targetTile);
  });
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
    : getStatModifierTotal(targetAvatar, 'dodge', targetAvatar.statistics.dodge) +
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
