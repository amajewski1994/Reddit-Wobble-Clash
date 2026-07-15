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
  scale: number;
};

export type Character = {
  id: number;
  class: string;
  name: string;
  image: string;
  description: string;
  objectName: CharacterObjectVariant[];
  statistics: CharacterStatistics;
  abilitiesId: number;
};

export type AbilityCategory =
  | 'heal'
  | 'boost'
  | 'reduce'
  | 'attack'
  | 'cleanse'
  | 'utility';

export type Ability = {
  name: string;
  description: string;
  category: AbilityCategory;
  cooldown: number | null;
};

export type PassiveAbility = Ability & { cooldown: null };
export type ActiveAbility = Ability & { cooldown: number };

export type ClassAbilities = {
  passive: PassiveAbility;
  active: ActiveAbility[];
};

export type CharacterAbilities = {
  id: number;
  class: string;
  abilities: ClassAbilities;
};
