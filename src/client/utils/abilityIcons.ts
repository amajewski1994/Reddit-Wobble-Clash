import type { AbilityCategory } from '../../shared/types/characters';

const ABILITY_CATEGORY_ICONS: Record<AbilityCategory, string> = {
  heal: '💚',
  boost: '⬆️',
  reduce: '⬇️',
  attack: '⚔️',
  cleanse: '✨',
  utility: '🔧',
};

export const getAbilityCategoryIcon = (category: AbilityCategory) =>
  ABILITY_CATEGORY_ICONS[category];
