import {
  userTeam as initialUserTeam,
  enemyTeam as initialEnemyTeam,
} from '../components/duelMode/teamsDate';

// Both teams are rolled fresh per duel (see teamsDate.ts), so this must read
// the live imported bindings on every call rather than snapshotting them
// once at module load, when both are still empty.
const getInitialMember = (id: number) =>
  [...initialUserTeam, ...initialEnemyTeam].find((member) => member.id === id);

export const getMaxHp = (id: number) =>
  getInitialMember(id)?.statistics.hp ?? 100;

export const getMaxAp = (id: number) =>
  getInitialMember(id)?.statistics.AP ?? 0;
