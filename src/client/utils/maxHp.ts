import {
  userTeam as initialUserTeam,
  enemyTeam as initialEnemyTeam,
} from '../components/duelMode/teamsDate';

const INITIAL_MEMBERS = [...initialUserTeam, ...initialEnemyTeam];

export const getMaxHp = (id: number) =>
  INITIAL_MEMBERS.find((member) => member.id === id)?.statistics.hp ?? 100;
