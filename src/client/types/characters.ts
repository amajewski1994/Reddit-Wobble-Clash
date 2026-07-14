export type CharacterTileBlueprint = {
  grassBP: number;
  sandBP: number;
  stoneBP: number;
  dirtBP: number;
  forestBP: number;
  desertBP: number;
  rocksBP: number;
};

export type CharacterStatistics = {
  hp: number;
  attack: number;
  defence: number;
  AP: number;
  dodge: number;
  accuracy: number;
  tileBP: CharacterTileBlueprint;
};

export type CharacterObjectVariant = {
  id: number;
  lvl: number;
  name: string;
};

export type Character = {
  id: number;
  class: string;
  name: string;
  description: string;
  objectName: CharacterObjectVariant[];
  statistics: CharacterStatistics;
  abilitiesId: number;
};

export type Ability = {
  name: string;
  description: string;
};

export type ClassAbilities = {
  passive: Ability;
  active: Ability[];
};

export type CharacterAbilities = {
  id: number;
  class: string;
  abilities: ClassAbilities;
};
