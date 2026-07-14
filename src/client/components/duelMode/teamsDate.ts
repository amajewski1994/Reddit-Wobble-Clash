import type { TeamMember } from '../../types/team';
import { characters } from '../../data/characters';
import { abilities } from '../../data/abilities';

type TeamMemberBase = Pick<
  TeamMember,
  'id' | 'tileID' | 'rotationY' | 'characterId'
>;

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
  const abilityNames = characterAbilities
    ? [
        characterAbilities.abilities.passive.name,
        ...characterAbilities.abilities.active.map(({ name }) => name),
      ]
    : [];

  return {
    id,
    name: character.name,
    objectName: baseObjectVariant.name,
    statistics: character.statistics,
    tileID,
    rotationY,
    abilities: abilityNames,
    characterId,
  };
};

const userTeamBase: TeamMemberBase[] = [
  { id: 0, tileID: 0, rotationY: 0, characterId: 0 },
  { id: 1, tileID: 1, rotationY: 0, characterId: 1 },
  { id: 2, tileID: 12, rotationY: 0, characterId: 2 },
];

const enemyTeamBase: TeamMemberBase[] = [
  { id: 100, tileID: 13, rotationY: 0, characterId: 3 },
];

export const userTeam: TeamMember[] = userTeamBase.map(buildTeamMember);
export const enemyTeam: TeamMember[] = enemyTeamBase.map(buildTeamMember);
