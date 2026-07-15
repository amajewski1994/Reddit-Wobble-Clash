import type { ActiveAbility } from '../../shared/types/characters';
import type {
  ModifierMode,
  ModifierStat,
  StatModifier,
  TeamMember,
} from '../../shared/types/team';
import { getMaxHp } from './maxHp';
import { tileHasPart } from './tileBonus';

const BATTLE_SPIRIT_ATTACK_PER_DEFEATED_ENEMY = 2;
const PROTECTOR_DEFENCE_BONUS = 1;
const PROTECT_DURATION_TURNS = 1;
const CLEANSING_STRIKE_SUPPRESSION_TURNS = 3;
const STAND_FIRM_DURATION_TURNS = 1;
const ENDURE_DURATION_TURNS = 1;
const JACK_OF_ALL_TRADES_ATTACK_BONUS = 1;
const JACK_OF_ALL_TRADES_DEFENCE_BONUS = 1;
const MOUNTAIN_STRENGTH_ATTACK_BONUS = 3;
const STONE_SKIN_DEFENCE_BONUS = 3;
const ENCOURAGEMENT_ATTACK_BONUS = 1;
const EVASION_DODGE_BONUS = 10;
const DESERT_WALKER_DODGE_BONUS = 10;
const SOLID_GROUND_MOVE_RANGE_BONUS = 1;
const NATURAL_RECOVERY_HEAL = 5;
const NATURES_BLESSING_HEAL = 5;
const CRUSHING_BLOWS_DAMAGE_MULTIPLIER = 2;

export type AbilityTargetType = 'self' | 'ally' | 'allies' | 'enemy';

// Shared by getAbilityTargetType and the boost/heal-effect functions below so
// they all agree on which abilities target a single ally (e.g. "Target ally
// gains ...", "Add 1 AP to a target ally.") vs the whole ally team (e.g.
// "Restore 20 HP to all allies.").
const isAllyTargetedDescription = (description: string): boolean =>
  /target ally|to a target ally/i.test(description);

const isAlliesTargetedDescription = (description: string): boolean =>
  /all allies/i.test(description);

const isSelfTargetedDescription = (description: string): boolean =>
  !isAllyTargetedDescription(description) &&
  !isAlliesTargetedDescription(description);

// 'reduce' and 'attack' abilities are always cast on an enemy (or several, for
// 'attack'), regardless of wording (they say "the target"/"target enemy"
// rather than "ally").
export const getAbilityTargetType = (
  ability: ActiveAbility
): AbilityTargetType => {
  if (ability.category === 'reduce' || ability.category === 'attack')
    return 'enemy';
  if (isAlliesTargetedDescription(ability.description)) return 'allies';
  if (isAllyTargetedDescription(ability.description)) return 'ally';
  return 'self';
};

// 'attack' abilities perform a normal attack roll (tile/passive bonuses,
// protector redirection, dodge/accuracy) with one twist described in their
// own text: a damage multiplier ("+50% attack value"), a guaranteed hit
// ("cannot be dodged"/"cannot be missed"), and/or extra targets ("Attack two
// enemies."). The actual attack roll lives in duelMap.tsx (it needs tile
// data), these just describe how to bend it.
export type AttackAbilityModifiers = {
  damageMultiplier: number;
  ignoreDodge: boolean;
  ignoreMiss: boolean;
};

export const getAttackAbilityModifiers = (
  ability: ActiveAbility
): AttackAbilityModifiers => {
  const percentMatch = ability.description.match(/\+?(\d+)%\s*attack value/i);
  return {
    damageMultiplier: percentMatch ? 1 + Number(percentMatch[1]) / 100 : 1,
    ignoreDodge: /cannot be dodged/i.test(ability.description),
    ignoreMiss: /cannot be missed/i.test(ability.description),
  };
};

const ATTACK_TARGET_COUNT_WORDS: Record<string, number> = {
  two: 2,
  three: 3,
  four: 4,
};

export const getAttackAbilityTargetCount = (ability: ActiveAbility): number => {
  const match = ability.description.match(
    /attack\s+(\d+|two|three|four)\s+enemies/i
  );
  const token = match?.[1]?.toLowerCase();
  if (!token) return 1;
  return ATTACK_TARGET_COUNT_WORDS[token] ?? Number(token);
};

// 'utility' movement abilities (Dash, Sprint, Dune Rush: "Move up to N
// tiles...") let the caster move further than the usual single tile in one
// go. The actual pathing (blocked by impassable terrain/occupied tiles)
// lives in duelMap.tsx (it needs tile data); this just gives the range.
export const getMoveAbilityRange = (ability: ActiveAbility): number | null => {
  const match = ability.description.match(/move up to\s+(\d+)\s+tiles?/i);
  const amount = match?.[1];
  return amount ? Number(amount) : null;
};

const ABILITY_ANIMATION_CLIP: Record<string, string> = {
  'Power Strike': 'Magic01',
  'Cleansing Strike': 'Magic01',
  'Second Wind': 'Magic02',
};

export const getAbilityAnimationClip = (abilityName: string): string =>
  ABILITY_ANIMATION_CLIP[abilityName] ?? 'Magic01';

export const isBonusSuppressed = (member: TeamMember): boolean =>
  member.bonusesSuppressedTurns !== null;

export const isDamageImmune = (member: TeamMember): boolean =>
  member.damageImmuneTurnsRemaining !== null;

export const isEndureActive = (member: TeamMember): boolean =>
  member.endureTurnsRemaining !== null;

export const isHitAndRunPending = (member: TeamMember): boolean =>
  member.hitAndRunPending;

// 'reduce' abilities work exactly like 'boost' ones (see applyBoostEffect
// below) except the amount is subtracted instead of added, and the target is
// always an enemy: either an instant AP loss (Root Trap, Mud Trap: "... loses
// 1 AP next turn.") or a timed, negative StatModifier (Taunt, Sandstorm).
const REDUCE_STAT_PATTERN = /(\d+)\s*(Attack|Defence|Accuracy|Dodge)/gi;

const parseStatReduceFromDescription = (
  description: string
): {
  stat: ModifierStat;
  mode: ModifierMode;
  amount: number;
  turns: number | null;
} | null => {
  const turnsMatch = description.match(/for\s+(\d+)\s+turns?/i);
  const turns = turnsMatch ? Number(turnsMatch[1]) : null;

  const matches = [...description.matchAll(REDUCE_STAT_PATTERN)];
  const chosen = matches[Math.floor(Math.random() * matches.length)];
  const amount = chosen?.[1];
  const statName = chosen?.[2];
  if (!amount || !statName) return null;
  return {
    stat: statName.toLowerCase() as ModifierStat,
    mode: 'flat',
    amount: -Number(amount),
    turns,
  };
};

const applyReduceEffect = (
  target: TeamMember,
  ability: ActiveAbility
): TeamMember => {
  const apAmount = parseApBoostAmount(ability.description);
  if (apAmount !== null) {
    return {
      ...target,
      statistics: {
        ...target.statistics,
        AP: Math.max(0, target.statistics.AP - apAmount),
      },
    };
  }

  const parsed = parseStatReduceFromDescription(ability.description);
  if (!parsed) return target;

  const modifier: StatModifier = {
    stat: parsed.stat,
    mode: parsed.mode,
    amount: parsed.amount,
    turnsRemaining: parsed.turns,
    sourceAbility: ability.name,
  };
  return {
    ...target,
    statModifiers: [
      ...target.statModifiers.filter(
        (existing) => existing.stat !== parsed.stat
      ),
      modifier,
    ],
  };
};

// 'boost' abilities grant either a timed StatModifier or an instant AP gain
// to their recipient (the caster for self-cast ones, or the chosen ally for
// ally-targeted ones, e.g. Inspire, Fortify from Support, Quick Step, Relay,
// Motivation). Every class has its own set of these (Rage, Focus, Blur,
// Bloom, ...), and a couple of names are even reused across classes with
// different effects (e.g. "Fortify"), so instead of a per-name lookup table
// the stat/AP amount and duration are parsed straight out of the ability's
// own description text.
const BOOST_STAT_PATTERN = /\+\s*(\d+)\s*(Attack|Defence|Accuracy|Dodge)/gi;

const parseApBoostAmount = (description: string): number | null => {
  const match = description.match(/(\d+)\s*AP\b/i);
  return match ? Number(match[1]) : null;
};

const parseStatBoostFromDescription = (
  description: string
): {
  stat: ModifierStat;
  mode: ModifierMode;
  amount: number;
  turns: number | null;
} | null => {
  const turnsMatch = description.match(/for\s+(\d+)\s+turns?/i);
  const turns = turnsMatch ? Number(turnsMatch[1]) : null;

  const percentMatch = description.match(/(\d+)%\s*more damage/i);
  if (percentMatch) {
    return {
      stat: 'attack',
      mode: 'percent',
      amount: Number(percentMatch[1]),
      turns,
    };
  }

  const matches = [...description.matchAll(BOOST_STAT_PATTERN)];
  const chosen = matches[Math.floor(Math.random() * matches.length)];
  const amount = chosen?.[1];
  const statName = chosen?.[2];
  if (!amount || !statName) return null;
  return {
    stat: statName.toLowerCase() as ModifierStat,
    mode: 'flat',
    amount: Number(amount),
    turns,
  };
};

// Applies a boost ability's effect to whichever member is meant to receive
// it. Caller decides who that is: the caster for self-cast boosts, or the
// selected ally for ally-targeted ones.
const applyBoostEffect = (
  member: TeamMember,
  ability: ActiveAbility
): TeamMember => {
  if (isBonusSuppressed(member)) return member;

  const apAmount = parseApBoostAmount(ability.description);
  if (apAmount !== null) {
    return {
      ...member,
      statistics: { ...member.statistics, AP: member.statistics.AP + apAmount },
    };
  }

  const parsed = parseStatBoostFromDescription(ability.description);
  if (!parsed) return member;

  const modifier: StatModifier = {
    stat: parsed.stat,
    mode: parsed.mode,
    amount: parsed.amount,
    turnsRemaining: parsed.turns,
    sourceAbility: ability.name,
  };
  return {
    ...member,
    statModifiers: [
      ...member.statModifiers.filter(
        (existing) => existing.stat !== parsed.stat
      ),
      modifier,
    ],
  };
};

// 'heal' abilities restore HP, capped at the member's max HP. Like boost
// abilities, the amount is parsed from the description, and whether it lands
// on the caster or a chosen recipient depends on whether it's self-, ally-,
// or allies-targeted (e.g. Second Wind/Recover are self; Heal is ally;
// Group Heal is allies).
const parseHealAmount = (description: string): number | null => {
  const match = description.match(/restore\s+(\d+)\s*hp/i);
  return match ? Number(match[1]) : null;
};

const applyHealEffect = (
  member: TeamMember,
  ability: ActiveAbility
): TeamMember => {
  const amount = parseHealAmount(ability.description);
  if (amount === null) return member;
  return {
    ...member,
    statistics: {
      ...member.statistics,
      hp: Math.min(getMaxHp(member.id), member.statistics.hp + amount),
    },
  };
};

const applyAbilityEffectToCaster = (
  member: TeamMember,
  ability: ActiveAbility
): TeamMember => {
  if (ability.category === 'boost') {
    // Ally/allies-targeted boosts affect the chosen recipient(s), not the
    // caster; the caster only pays the AP cost and cooldown (handled in
    // activateAbility).
    if (!isSelfTargetedDescription(ability.description)) return member;
    return applyBoostEffect(member, ability);
  }
  if (ability.category === 'heal') {
    if (!isSelfTargetedDescription(ability.description)) return member;
    return applyHealEffect(member, ability);
  }
  switch (ability.name) {
    case 'Protect':
      return {
        ...member,
        protectTurnsRemaining: PROTECT_DURATION_TURNS,
      };
    case 'Stand Firm':
      return {
        ...member,
        damageImmuneTurnsRemaining: STAND_FIRM_DURATION_TURNS,
      };
    case 'Endure':
      return {
        ...member,
        endureTurnsRemaining: ENDURE_DURATION_TURNS,
      };
    case 'Hit and Run':
      return {
        ...member,
        hitAndRunPending: true,
      };
    default:
      return member;
  }
};

export const activateAbility = (
  member: TeamMember,
  ability: ActiveAbility
): TeamMember => {
  const withEffect = applyAbilityEffectToCaster(member, ability);
  return {
    ...withEffect,
    statistics: {
      ...withEffect.statistics,
      AP: Math.max(0, withEffect.statistics.AP - 1),
    },
    abilityCooldowns: {
      ...withEffect.abilityCooldowns,
      [ability.name]: ability.cooldown,
    },
  };
};

export const applyAbilityEffectToTarget = (
  target: TeamMember,
  ability: ActiveAbility
): TeamMember => {
  if (ability.name === 'Cleansing Strike') {
    return {
      ...target,
      statModifiers: target.statModifiers.filter(
        (modifier) => modifier.amount < 0
      ),
      bonusesSuppressedTurns: CLEANSING_STRIKE_SUPPRESSION_TURNS,
    };
  }
  if (ability.name === 'Lucky Find') {
    const activeAbilities = target.abilities.active;
    const chosen =
      activeAbilities[Math.floor(Math.random() * activeAbilities.length)];
    if (!chosen) return target;
    return {
      ...target,
      abilityCooldowns: {
        ...target.abilityCooldowns,
        [chosen.name]: 0,
      },
    };
  }
  if (ability.category === 'reduce') {
    return applyReduceEffect(target, ability);
  }
  if (
    ability.category === 'boost' &&
    !isSelfTargetedDescription(ability.description)
  ) {
    return applyBoostEffect(target, ability);
  }
  if (
    ability.category === 'heal' &&
    !isSelfTargetedDescription(ability.description)
  ) {
    return applyHealEffect(target, ability);
  }
  return target;
};

// Clears modifiers meant to be consumed by the caster's next attack
// (turnsRemaining: null), e.g. Power Strike.
export const consumeAttackModifiers = (member: TeamMember): TeamMember => ({
  ...member,
  statModifiers: member.statModifiers.filter(
    (modifier) =>
      !(modifier.stat === 'attack' && modifier.turnsRemaining === null)
  ),
});

export const decrementStatModifiers = (
  modifiers: StatModifier[]
): StatModifier[] =>
  modifiers
    .map((modifier) =>
      modifier.turnsRemaining === null
        ? modifier
        : { ...modifier, turnsRemaining: modifier.turnsRemaining - 1 }
    )
    .filter(
      (modifier) =>
        modifier.turnsRemaining === null || modifier.turnsRemaining > 0
    );

const getModifierAmount = (
  modifier: StatModifier,
  baseValue: number
): number =>
  modifier.mode === 'percent'
    ? Math.round((baseValue * modifier.amount) / 100)
    : modifier.amount;

export const getStatModifierTotal = (
  member: TeamMember,
  stat: ModifierStat,
  baseValue: number
): number =>
  member.statModifiers
    .filter((modifier) => modifier.stat === stat)
    .reduce((sum, modifier) => {
      const amount = getModifierAmount(modifier, baseValue);
      if (amount > 0 && isBonusSuppressed(member)) return sum;
      return sum + amount;
    }, 0);

export const getEffectiveBonus = (bonus: number, member: TeamMember): number =>
  isBonusSuppressed(member) ? 0 : bonus;

export const findProtector = (
  target: TeamMember,
  targetTeam: TeamMember[],
  isAdjacentToTarget: (member: TeamMember) => boolean
): TeamMember | undefined =>
  targetTeam.find(
    (member) =>
      member.id !== target.id &&
      member.protectTurnsRemaining !== null &&
      member.statistics.hp > 0 &&
      isAdjacentToTarget(member)
  );

// Self-conditional attack bonus: depends only on the member's own passive
// (battle state for Battle Spirit, terrain for Mountain Strength) — not on
// allies, unlike getPassiveAllyAttackBonus below.
export const getPassiveAttackBonus = (
  member: TeamMember,
  opposingTeam: TeamMember[],
  tileName: string
): number => {
  switch (member.abilities.passive.name) {
    case 'Battle Spirit': {
      const defeatedCount = opposingTeam.filter(
        ({ statistics }) => statistics.hp <= 0
      ).length;
      return defeatedCount * BATTLE_SPIRIT_ATTACK_PER_DEFEATED_ENEMY;
    }
    case 'Jack of All Trades':
      return JACK_OF_ALL_TRADES_ATTACK_BONUS;
    case 'Mountain Strength':
      return tileHasPart(tileName, 'rocks')
        ? MOUNTAIN_STRENGTH_ATTACK_BONUS
        : 0;
    default:
      return 0;
  }
};

// Self-conditional defence bonus (own passive + terrain), distinct from the
// "adjacent Protector" bonus below.
export const getOwnPassiveDefenceBonus = (
  member: TeamMember,
  tileName: string
): number => {
  switch (member.abilities.passive.name) {
    case 'Jack of All Trades':
      return JACK_OF_ALL_TRADES_DEFENCE_BONUS;
    case 'Stone Skin':
      return tileHasPart(tileName, 'stone') ? STONE_SKIN_DEFENCE_BONUS : 0;
    default:
      return 0;
  }
};

export const getPassiveDefenceBonus = (
  member: TeamMember,
  allyTeam: TeamMember[],
  isAdjacentToMember: (ally: TeamMember) => boolean
): number => {
  const hasAdjacentGuardian = allyTeam.some(
    (ally) =>
      ally.id !== member.id &&
      ally.abilities.passive.name === 'Protector' &&
      ally.statistics.hp > 0 &&
      isAdjacentToMember(ally)
  );
  return hasAdjacentGuardian ? PROTECTOR_DEFENCE_BONUS : 0;
};

// Mirrors getPassiveDefenceBonus (Protector) for Encouragement's +1 Attack
// to adjacent allies.
export const getPassiveAllyAttackBonus = (
  member: TeamMember,
  allyTeam: TeamMember[],
  isAdjacentToMember: (ally: TeamMember) => boolean
): number => {
  const hasAdjacentSupport = allyTeam.some(
    (ally) =>
      ally.id !== member.id &&
      ally.abilities.passive.name === 'Encouragement' &&
      ally.statistics.hp > 0 &&
      isAdjacentToMember(ally)
  );
  return hasAdjacentSupport ? ENCOURAGEMENT_ATTACK_BONUS : 0;
};

export const getPassiveDodgeBonus = (
  member: TeamMember,
  tileName: string
): number => {
  switch (member.abilities.passive.name) {
    case 'Evasion':
      return EVASION_DODGE_BONUS;
    case 'Desert Walker':
      return tileHasPart(tileName, 'sand') ? DESERT_WALKER_DODGE_BONUS : 0;
    default:
      return 0;
  }
};

// Eagle Eye: the attacker ignores the target's dodge bonuses (stat-modifier
// and passive), but not their base dodge stat.
export const isIgnoringEnemyDodgeBonuses = (member: TeamMember): boolean =>
  member.abilities.passive.name === 'Eagle Eye';

// Solid Ground: +1 move range while on Dirt, added to the usual single-tile
// move (and to move abilities' own range, e.g. Dash/Sprint/Dune Rush).
export const getPassiveMoveRangeBonus = (
  member: TeamMember,
  tileName: string
): number =>
  member.abilities.passive.name === 'Solid Ground' &&
  tileHasPart(tileName, 'dirt')
    ? SOLID_GROUND_MOVE_RANGE_BONUS
    : 0;

// Crushing Blows: the attacker's first attack this battle deals double
// damage. `member.hasAttacked` is flipped true after any attack action
// (game.tsx), so this only ever fires once.
export const getCrushingBlowsMultiplier = (member: TeamMember): number =>
  member.abilities.passive.name === 'Crushing Blows' && !member.hasAttacked
    ? CRUSHING_BLOWS_DAMAGE_MULTIPLIER
    : 1;

// Turn-start heal-over-time passives (Natural Recovery is unconditional,
// Nature's Blessing only while on Grass), applied once per handleEndTurn.
export const getPassiveTurnStartHeal = (
  member: TeamMember,
  tileName: string
): number => {
  switch (member.abilities.passive.name) {
    case 'Natural Recovery':
      return NATURAL_RECOVERY_HEAL;
    case "Nature's Blessing":
      return tileHasPart(tileName, 'grass') ? NATURES_BLESSING_HEAL : 0;
    default:
      return 0;
  }
};

export const getActiveStatusNames = (member: TeamMember): string[] => {
  const statuses = member.statModifiers.map(
    (modifier) => modifier.sourceAbility
  );
  if (member.protectTurnsRemaining !== null) statuses.push('Protect');
  if (member.bonusesSuppressedTurns !== null) statuses.push('Cleansing Strike');
  if (member.damageImmuneTurnsRemaining !== null) statuses.push('Stand Firm');
  if (member.endureTurnsRemaining !== null) statuses.push('Endure');
  if (member.hitAndRunPending) statuses.push('Hit and Run');
  return statuses;
};
