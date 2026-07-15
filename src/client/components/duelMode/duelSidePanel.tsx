import type { TeamMember } from '../../../shared/types/team';
import { UserInfo } from '../../data/userInfo';
import { EnemyInfo } from '../../data/enemyInfo';
import { actionButtonClassName, getMaxHp, HpBar } from './duelMapShared';

const MiniCard = ({
  id,
  hp,
  isEnemy,
  onSelect,
}: {
  id: number;
  hp: number;
  isEnemy: boolean;
  onSelect: () => void;
}) => (
  <div
    onClick={onSelect}
    className={`duel-panel ${isEnemy ? 'duel-panel--enemy' : 'duel-panel--team'} flex flex-col gap-1.5 w-15 p-1.5 cursor-pointer transition-opacity ${
      hp <= 0 ? 'opacity-40 grayscale' : ''
    }`}
  >
    <div className="flex items-center justify-center w-full h-10.5 rounded border border-dashed border-(--panel-border) text-lg opacity-70">
      {isEnemy ? '💀' : '🪖'}
    </div>
    <div className="flex items-center justify-between text-xs">
      <span className="uppercase tracking-wide text-(--muted)">HP</span>
      <span className="font-bold">{hp}</span>
    </div>
    <HpBar hp={hp} maxHp={getMaxHp(id)} isEnemy={isEnemy} />
  </div>
);

interface DuelSidePanelProps {
  side: 'left' | 'right';
  members: TeamMember[];
  isVisible: boolean;
  onSelectAvatarId: (id: number) => void;
  onItemsClick?: () => void;
}

export const DuelSidePanel = ({
  side,
  members,
  isVisible,
  onSelectAvatarId,
  onItemsClick,
}: DuelSidePanelProps) => {
  const isEnemy = side === 'right';
  const info = isEnemy ? EnemyInfo : UserInfo;

  return (
    <div
      className={`fixed top-2 z-10 flex flex-col gap-2 transition-all duration-500 ${
        isEnemy ? 'right-2 items-end' : 'left-2'
      } ${
        isVisible
          ? 'opacity-100'
          : `${isEnemy ? 'translate-x-[150%]' : 'translate-x-[-150%]'} opacity-0`
      }`}
    >
      <div
        className={`flex flex-col gap-1 ${isEnemy ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`duel-hex-badge ${isEnemy ? 'duel-hex-badge--enemy' : 'duel-hex-badge--team'} w-14 h-14 shrink-0`}
        >
          <div className="duel-hex-badge__inner text-2xl">
            {isEnemy ? '💀' : '🛡️'}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center text-sm font-bold">
          <span>{info.name}</span>
          {/* <span
            className={`text-xs font-semibold ${isEnemy ? 'text-(--danger)' : 'text-(--secondary)'}`}
          >
            lvl {info.lvl}
          </span> */}
        </div>
      </div>
      {/* {onItemsClick && (
        <button
          className={`${actionButtonClassName} h-4 px-2 gap-1 text-[10px]`}
          onClick={onItemsClick}
        >
          🎒 Items
        </button>
      )} */}
      {members.map(({ id, statistics }) => (
        <MiniCard
          key={id}
          id={id}
          hp={statistics.hp}
          isEnemy={isEnemy}
          onSelect={() => onSelectAvatarId(id)}
        />
      ))}
    </div>
  );
};
