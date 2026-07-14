import type { TeamMember } from '../../types/team';
import { characters } from '../../data/characters';
import { abilities } from '../../data/abilities';

type TeamMemberBase = Pick<
  TeamMember,
  'id' | 'tileID' | 'rotationY' | 'characterId'
>;

// Passives with no condition (unconditional, no duration) are simplest to
// bake straight into the member's base stats at creation, rather than
// recomputing them on every render — unlike Battle Spirit/Protector/etc.,
// which depend on battle state or terrain and are computed dynamically in
// utils/abilities.ts.
const PASSIVE_MAX_HP_BONUS: Record<string, number> = { Toughness: 20 };
const PASSIVE_AP_BONUS: Record<string, number> = { 'Fast Feet': 1 };

const buildTeamMember = ({
  id,
  tileID,
  rotationY,
  characterId,
}: TeamMemberBase): TeamMember => {
  const character = characters.find(({ id }) => id === characterId);
  if (!character) {
    throw new Error(`Character with id ${characterId} not found`);
  }

  const baseObjectVariant = character.objectName[0];
  if (!baseObjectVariant) {
    throw new Error(`Character with id ${characterId} has no objectName`);
  }

  const characterAbilities = abilities.find(
    ({ id }) => id === character.abilitiesId
  );
  if (!characterAbilities) {
    throw new Error(
      `Abilities with id ${character.abilitiesId} not found for character ${characterId}`
    );
  }

  const passiveName = characterAbilities.abilities.passive.name;
  const hpBonus = PASSIVE_MAX_HP_BONUS[passiveName] ?? 0;
  const apBonus = PASSIVE_AP_BONUS[passiveName] ?? 0;

  return {
    id,
    name: character.name,
    objectName: baseObjectVariant.name,
    statistics: {
      ...character.statistics,
      hp: character.statistics.hp + hpBonus,
      AP: character.statistics.AP + apBonus,
    },
    tileID,
    rotationY,
    abilities: characterAbilities.abilities,
    abilityCooldowns: {},
    statModifiers: [],
    bonusesSuppressedTurns: null,
    protectTurnsRemaining: null,
    damageImmuneTurnsRemaining: null,
    endureTurnsRemaining: null,
    hitAndRunPending: false,
    hasAttacked: false,
    characterId,
  };
};

const userTeamBase: TeamMemberBase[] = [
  { id: 0, tileID: 12, rotationY: 0, characterId: 4 },
  { id: 1, tileID: 1, rotationY: 0, characterId: 1 },
  { id: 2, tileID: 0, rotationY: 0, characterId: 2 },
];

const enemyTeamBase: TeamMemberBase[] = [
  { id: 100, tileID: 13, rotationY: 0, characterId: 3 },
];

export const userTeam: TeamMember[] = userTeamBase.map(buildTeamMember);
export const enemyTeam: TeamMember[] = enemyTeamBase.map(buildTeamMember);
