import type { TeamMember } from '../../types/team';

export const userTeam: TeamMember[] = [
  {
    id: 0,
    name: 'avatar_duelist_v1',
    hp: 100,
    attack: 10,
    defence: 1,
    AP: 3,
    tileID: 0,
    rotationY: 0,
  },
  {
    id: 1,
    name: 'avatar_tank_v1',
    hp: 100,
    attack: 15,
    defence: 2,
    AP: 3,
    tileID: 1,
    rotationY: 0,
  },
];

export const enemyTeam: TeamMember[] = [
  {
    id: 100,
    name: 'avatar_tracker_v1',
    hp: 100,
    attack: 10,
    defence: 1,
    AP: 3,
    tileID: 12,
    rotationY: 0,
  },
  {
    id: 101,
    name: 'avatar_wildheart_v1',
    hp: 100,
    attack: 15,
    defence: 2,
    AP: 3,
    tileID: 13,
    rotationY: 0,
  },
];
