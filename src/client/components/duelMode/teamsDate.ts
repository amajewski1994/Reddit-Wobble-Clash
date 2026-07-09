import type { TeamMember } from '../../types/team';

export const userTeam: TeamMember[] = [
  {
    id: 0,
    name: 'avatar_duelist_v1',
    statistics: {
      hp: 100,
      attack: 10,
      defence: 1,
      AP: 3,
      dodge: 10,
      accuracy: 90,
    },
    tileID: 0,
    rotationY: 0,
    utilities: ['test1', 'test2', 'test3', 'test4'],
  },
  {
    id: 1,
    name: 'avatar_tank_v1',
    statistics: {
      hp: 100,
      attack: 150,
      defence: 2,
      AP: 3,
      dodge: 10,
      accuracy: 90,
    },
    tileID: 1,
    rotationY: 0,
    utilities: ['test5', 'test6', 'test7', 'test8'],
  },
  {
    id: 2,
    name: 'avatar_tracker_v1',
    statistics: {
      hp: 100,
      attack: 150,
      defence: 2,
      AP: 3,
      dodge: 10,
      accuracy: 90,
    },
    tileID: 12,
    rotationY: 0,
    utilities: ['test9', 'test10', 'test11', 'test12'],
  },
];

export const enemyTeam: TeamMember[] = [
  {
    id: 100,
    name: 'avatar_wildheart_v1',
    statistics: {
      hp: 100,
      attack: 15,
      defence: 2,
      AP: 3,
      dodge: 90,
      accuracy: 90,
    },
    tileID: 13,
    rotationY: 0,
    utilities: ['test1', 'test2', 'test3', 'test4'],
  },
];
