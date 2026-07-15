import type { TeamMemberTileStatistics } from '../../shared/types/team';

const TILE_BP_KEY_BY_NAME_PART: Record<string, keyof TeamMemberTileStatistics> =
  {
    grass: 'grassBP',
    sand: 'sandBP',
    stone: 'stoneBP',
    dirt: 'dirtBP',
    forest: 'forestBP',
    desert: 'desertBP',
    rocks: 'rocksBP',
  };

export const getTileBPBonus = (
  tileName: string,
  tileBP: TeamMemberTileStatistics
) =>
  tileName.split('-').reduce((sum, part) => {
    const key = TILE_BP_KEY_BY_NAME_PART[part];
    return key ? sum + (tileBP[key] ?? 0) : sum;
  }, 0);

// Tile names are hyphen-joined parts (e.g. "sand-rocks"); used by
// terrain-conditional passives (Desert Walker, Stone Skin, ...) to check
// whether a member is currently standing on a given terrain type.
export const tileHasPart = (tileName: string, part: string): boolean =>
  tileName.split('-').includes(part);
