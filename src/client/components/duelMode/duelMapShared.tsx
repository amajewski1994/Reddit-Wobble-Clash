import {
  userTeam as initialUserTeam,
  enemyTeam as initialEnemyTeam,
} from './teamsDate';

const INITIAL_MEMBERS = [...initialUserTeam, ...initialEnemyTeam];

export const getMaxHp = (id: number) =>
  INITIAL_MEMBERS.find((member) => member.id === id)?.statistics.hp ?? 100;

export const actionButtonClassName =
  'game-button-primary duel-button-cut flex items-center justify-center gap-1 h-7 p-3 font-bold uppercase tracking-wide text-sm';

export const HpBar = ({
  hp,
  maxHp,
  isEnemy,
}: {
  hp: number;
  maxHp: number;
  isEnemy: boolean;
}) => (
  <div className="duel-hp-track w-full">
    <div
      className={`duel-hp-fill ${isEnemy ? 'duel-hp-fill--enemy' : 'duel-hp-fill--team'}`}
      style={{ width: `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%` }}
    />
  </div>
);
