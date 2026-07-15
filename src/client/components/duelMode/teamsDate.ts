import type { TeamMember } from '../../../shared/types/team';
import { characters } from '../../data/characters';
import { abilities } from '../../data/abilities';
import { duelMapTilesData } from './duelMapTilesData';

import type { PlacedAvatar } from '../../../shared/types/createMap';
import type { DuelMapTileData } from '../../../shared/types/mapTile';

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
    scale: baseObjectVariant.scale,
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

// Empty until the player goes through Pick Mode — see
// setUserTeamFromCharacterIds, which fills this in from the chosen
// character ids.
let userTeamBase: TeamMemberBase[] = [];

// Starting tileIDs are drawn (unique, passable-only) from a fixed id range
// per side of the duel map, so teams don't land on top of each other or on
// blocked terrain. Checked against duelMapTilesData's `blocked` field.
const drawStartingTileIds = (
  count: number,
  range: { min: number; max: number },
  tiles: DuelMapTileData[] = duelMapTilesData,
  occupiedTileIds: Set<number> = new Set()
): number[] => {
  const eligibleTileIds = tiles
    .filter(
      ({ id, blocked }) =>
        id >= range.min &&
        id <= range.max &&
        !blocked &&
        !occupiedTileIds.has(id)
    )
    .map(({ id }) => id);

  if (eligibleTileIds.length < count) {
    throw new Error(
      `Not enough free starting tiles. Required: ${count}, available: ${eligibleTileIds.length}`
    );
  }

  const pool = [...eligibleTileIds];
  const drawn: number[] = [];

  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * pool.length);
    drawn.push(pool.splice(index, 1)[0]!);
  }

  return drawn;
};

const ENEMY_STARTING_TILE_ID_RANGE = { min: 0, max: 29 };
const ENEMY_TEAM_SIZE = 4;

// Empty until the duel starts — see setEnemyTeamFromRandomCharacterIds,
// which rolls the enemy roster fresh for each duel.
let enemyTeamBase: TeamMemberBase[] = [];

// Facing handed out to the enemy team, in slot order.
const ENEMY_TEAM_SLOTS: { tileID: null; rotationY: number }[] = [
  { tileID: null, rotationY: 0 },
  { tileID: null, rotationY: 0 },
  { tileID: null, rotationY: 0 },
  { tileID: null, rotationY: 0 },
];

// Facing handed out to a team built from Pick Mode, in slot order. tileID is
// no longer fixed here — see drawStartingTileIds, which randomizes it within
// the back row on entry to the duel map.
const PICKED_TEAM_SLOTS: { tileID: null; rotationY: number }[] = [
  { tileID: null, rotationY: 180 },
  { tileID: null, rotationY: 180 },
  { tileID: null, rotationY: 180 },
  { tileID: null, rotationY: 180 },
];

const USER_STARTING_TILE_ID_RANGE = { min: 75, max: 104 };

const drawRandomCharacterIds = (count: number): number[] => {
  const pool = characters.map(({ id }) => id);
  const drawn: number[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * pool.length);
    drawn.push(pool.splice(index, 1)[0]!);
  }
  return drawn;
};

export let userTeam: TeamMember[] = userTeamBase.map(buildTeamMember);
export let enemyTeam: TeamMember[] = enemyTeamBase.map(buildTeamMember);

export const setUserTeamFromCharacterIds = (
  characterIds: number[],
  tiles: DuelMapTileData[] = duelMapTilesData,
  occupiedTileIds: Set<number> = new Set()
): TeamMember[] => {
  const tileIds = drawStartingTileIds(
    characterIds.length,
    USER_STARTING_TILE_ID_RANGE,
    tiles,
    occupiedTileIds
  );

  userTeamBase = characterIds.map((characterId, index) => ({
    id: index,
    characterId,
    tileID: tileIds[index]!,
    rotationY: PICKED_TEAM_SLOTS[index % PICKED_TEAM_SLOTS.length]!.rotationY,
  }));

  userTeam = userTeamBase.map(buildTeamMember);

  return userTeam;
};

// Rolls a fresh enemy roster (random characters, random back-row tiles) for
// the start of a duel.
export const setEnemyTeamFromRandomCharacterIds = (): TeamMember[] => {
  const characterIds = drawRandomCharacterIds(ENEMY_TEAM_SIZE);
  const tileIds = drawStartingTileIds(
    ENEMY_TEAM_SIZE,
    ENEMY_STARTING_TILE_ID_RANGE
  );
  enemyTeamBase = characterIds.map((characterId, index) => ({
    id: 100 + index,
    characterId,
    tileID: tileIds[index]!,
    rotationY: ENEMY_TEAM_SLOTS[index % ENEMY_TEAM_SLOTS.length]!.rotationY,
  }));
  enemyTeam = enemyTeamBase.map(buildTeamMember);
  return enemyTeam;
};

export const setEnemyTeamFromPlacedAvatars = (
  placedAvatars: PlacedAvatar[],
  tiles: DuelMapTileData[]
): TeamMember[] => {
  enemyTeamBase = placedAvatars.map((placedAvatar, index) => {
    const character = characters.find(
      ({ name }) => name === placedAvatar.avatarName
    );

    if (!character) {
      throw new Error(`Character "${placedAvatar.avatarName}" not found`);
    }

    const tile = tiles.find(({ id }) => id === placedAvatar.tileID);

    if (!tile) {
      throw new Error(`Tile ${placedAvatar.tileID} not found`);
    }

    if (tile.blocked) {
      throw new Error(`Enemy cannot be placed on blocked tile ${tile.id}`);
    }

    return {
      id: 100 + index,
      characterId: character.id,
      tileID: placedAvatar.tileID,
      rotationY: tile.rotationY,
    };
  });

  enemyTeam = enemyTeamBase.map(buildTeamMember);

  return enemyTeam;
};
