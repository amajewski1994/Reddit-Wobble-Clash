import type { ClassAbilities } from './characters';

export type TeamMemberTileStatistics = {
  grassBP: number;
  sandBP: number;
  stoneBP: number;
  dirtBP?: number;
  forestBP?: number;
  desertBP?: number;
  rocksBP?: number;
};

export type TeamMemberStatistics = {
  hp: number;
  attack: number;
  defence: number;
  AP: number;
  dodge: number;
  accuracy: number;
  tileBP: TeamMemberTileStatistics;
};

export type ModifierStat = 'attack' | 'defence' | 'accuracy' | 'dodge';
export type ModifierMode = 'flat' | 'percent';

// A signed, timed adjustment to one stat: positive amount = boost,
// negative = reduce. turnsRemaining: null means it isn't decremented by the
// turn tick, but cleared by some other trigger (e.g. Power Strike is
// consumed by the caster's next attack).
export type StatModifier = {
  stat: ModifierStat;
  mode: ModifierMode;
  amount: number;
  turnsRemaining: number | null;
  sourceAbility: string;
};

export type TeamMember = {
  id: number;
  name: string;
  objectName: string;
  statistics: TeamMemberStatistics;
  tileID: number;
  rotationY: number;
  abilities: ClassAbilities;
  abilityCooldowns: Record<string, number>;
  statModifiers: StatModifier[];
  bonusesSuppressedTurns: number | null;
  protectTurnsRemaining: number | null;
  damageImmuneTurnsRemaining: number | null;
  endureTurnsRemaining: number | null;
  // Consumed (not turn-decremented) the next time this member performs an
  // attack, same lifecycle as Power Strike's StatModifier.
  hitAndRunPending: boolean;
  // Set after this member's first attack action (regardless of hit/dodge/
  // miss); used by Crushing Blows ("The first attack in battle deals double
  // damage."), which only applies before this flips true. Never resets.
  hasAttacked: boolean;

  characterId: number;
};
