import { useState } from 'react';
import type { DuelMapUIProps } from '../../types/duelMap';
import type { TeamMember } from '../../types/team';
import { UserInfo } from '../../data/userInfo';
import { EnemyInfo } from '../../data/enemyInfo';

const END_TURN_HIDE_DURATION_MS = 3000;

const abbreviateAvatarName = (name: string) => {
  return name
    .split('_')
    .map((part) => {
      const versionMatch = part.match(/^v(\d+)$/i);
      if (versionMatch) return versionMatch[1];
      return part.charAt(0).toUpperCase();
    })
    .join('');
};

const actionButtonClassName =
  'flex items-center justify-center bg-[#d93900] dark:bg-orange-600 text-white h-10 rounded-full cursor-pointer transition-colors px-4 hover:bg-[#c23300] dark:hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d93900] dark:disabled:hover:bg-orange-600';

const MiniCard = ({ hp, onSelect }: { hp: number; onSelect: () => void }) => (
  <div
    onClick={onSelect}
    className={`flex flex-col gap-1 w-20 rounded-md border-2 border-[#d93900] dark:border-orange-600 bg-white dark:bg-gray-900 p-1.5 cursor-pointer transition-opacity ${
      hp <= 0 ? 'opacity-40 grayscale' : ''
    }`}
  >
    <div className="flex items-center justify-center w-full h-14 rounded border border-dashed border-[#d93900] dark:border-orange-600 text-[10px] text-gray-500 dark:text-gray-400">
      Zdjęcie
    </div>
    <div className="flex items-center justify-between text-xs text-gray-900 dark:text-white">
      <span>HP</span>
      <span>{hp}</span>
    </div>
  </div>
);

const FullCard = ({
  avatar,
  isEnemy,
  isMoveMode,
  isAttackMode,
  isUtilitiesOpen,
  onAttack,
  onMove,
  onUtilities,
}: {
  avatar: TeamMember;
  isEnemy: boolean;
  isMoveMode: boolean;
  isAttackMode: boolean;
  isUtilitiesOpen: boolean;
  onAttack: () => void;
  onMove: () => void;
  onUtilities: () => void;
}) => {
  const isDead = avatar.statistics.hp <= 0;

  return (
    <div
      className={`fixed top-1/2 right-4 -translate-y-1/2 z-10 w-56 flex flex-col gap-3 rounded-lg border-2 border-[#d93900] dark:border-orange-600 bg-white dark:bg-gray-900 p-4 text-gray-900 dark:text-white transition-all duration-300 ${
        isMoveMode || isAttackMode || isUtilitiesOpen ? 'translate-x-[calc(100%+1rem)]' : ''
      } ${isDead ? 'opacity-40 grayscale' : ''}`}
    >
      <div className="text-center font-semibold">{avatar.name}</div>
      <div className="flex items-center justify-center w-full h-32 rounded-md border-2 border-dashed border-[#d93900] dark:border-orange-600 text-xs text-gray-500 dark:text-gray-400">
        Zdjęcie
      </div>
      <div className="flex justify-between text-sm">
        <span>HP</span>
        <span>{avatar.statistics.hp}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>AP</span>
        <span>{avatar.statistics.AP}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Dodge</span>
        <span>{avatar.statistics.dodge}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Accuracy</span>
        <span>{avatar.statistics.accuracy}</span>
      </div>
      {!isEnemy && (
        <div className="flex flex-col gap-2">
          <button
            className={actionButtonClassName}
            onClick={onAttack}
            disabled={avatar.statistics.AP === 0 || isDead}
          >
            Attack
          </button>
          <button
            className={actionButtonClassName}
            onClick={onMove}
            disabled={avatar.statistics.AP === 0 || isDead}
          >
            Move
          </button>
          <button
            className={actionButtonClassName}
            onClick={onUtilities}
            disabled={avatar.statistics.AP === 0 || isDead}
          >
            Utilities
          </button>
        </div>
      )}
    </div>
  );
};

const SelectableCard = ({ name, onSelect }: { name: string; onSelect: () => void }) => (
  <div
    onClick={onSelect}
    className="flex flex-col items-center gap-2 w-28 rounded-md border-2 border-[#d93900] dark:border-orange-600 bg-white dark:bg-gray-900 p-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
  >
    <div className="flex items-center justify-center w-full h-20 rounded border border-dashed border-[#d93900] dark:border-orange-600 text-[10px] text-gray-500 dark:text-gray-400">
      Zdjęcie
    </div>
    <span className="text-xs font-semibold text-center text-gray-900 dark:text-white">{name}</span>
  </div>
);

const SelectionPopup = ({
  title,
  items,
  onSelectItem,
  onBack,
}: {
  title: string;
  items: string[];
  onSelectItem: (name: string) => void;
  onBack: () => void;
}) => (
  <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
    <div className="flex flex-col gap-4 w-full max-w-md mx-4 rounded-lg border-2 border-[#d93900] dark:border-orange-600 bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <div className="text-center font-semibold">{title}</div>
      <div className="flex flex-wrap justify-center gap-3">
        {items.map((name) => (
          <SelectableCard key={name} name={name} onSelect={() => onSelectItem(name)} />
        ))}
      </div>
      <button className={actionButtonClassName} onClick={onBack}>
        ← Back
      </button>
    </div>
  </div>
);

const BottomTeamCard = ({
  name,
  hp,
  isActive,
  onSelect,
}: {
  name: string;
  hp: number;
  isActive: boolean;
  onSelect: () => void;
}) => (
  <div
    onClick={onSelect}
    className={`flex items-center justify-center w-14 h-14 shrink-0 rounded-md border-2 cursor-pointer transition-all text-sm font-semibold ${
      isActive
        ? 'bg-[#d93900] dark:bg-orange-600 border-[#d93900] dark:border-orange-600 text-white'
        : 'bg-white dark:bg-gray-900 border-[#d93900] dark:border-orange-600 text-gray-900 dark:text-white'
    } ${hp <= 0 ? 'opacity-40 grayscale' : ''}`}
  >
    {abbreviateAvatarName(name)}
  </div>
);

export const DuelMapUI = ({
  team,
  enemyTeam,
  activeAvatarId,
  onSelectAvatarId,
  isMoveMode,
  isAttackMode,
  onAttack,
  onMove,
  turn,
  onEndTurn,
}: DuelMapUIProps) => {
  const [isEndingTurn, setIsEndingTurn] = useState(false);
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [lastActiveAvatarId, setLastActiveAvatarId] = useState(activeAvatarId);
  const activeAvatar = [...team, ...enemyTeam].find(({ id }) => id === activeAvatarId);
  const isActiveAvatarEnemy = !!activeAvatar && enemyTeam.some(({ id }) => id === activeAvatarId);
  const isCardOpen = !!activeAvatar;

  if (activeAvatarId !== lastActiveAvatarId) {
    setLastActiveAvatarId(activeAvatarId);
    setIsUtilitiesOpen(false);
  }

  const handleEndTurn = () => {
    if (isEndingTurn) return;
    setIsEndingTurn(true);
    onSelectAvatarId(null);
    setTimeout(() => {
      onEndTurn();
      setIsEndingTurn(false);
    }, END_TURN_HIDE_DURATION_MS);
  };

  return (
    <>
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-10 text-sm font-semibold text-gray-900 dark:text-white transition-all duration-500 ${
          isEndingTurn ? 'translate-y-[-150%] opacity-0' : 'opacity-100'
        }`}
      >
        Turn {turn}
      </div>
      <div
        className={`fixed top-4 left-4 z-10 flex flex-col gap-2 transition-all duration-500 ${
          isCardOpen || isEndingTurn ? 'translate-x-[-150%] opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col text-sm font-semibold text-gray-900 dark:text-white">
          <span>{UserInfo.name}</span>
          <span className="text-xs font-normal">lvl {UserInfo.lvl}</span>
        </div>
        <button
          className={`${actionButtonClassName} h-8 w-20 px-0 text-xs`}
          onClick={() => setIsItemsOpen(true)}
        >
          Items
        </button>
        {team.map(({ id, statistics }) => (
          <MiniCard key={id} hp={statistics.hp} onSelect={() => onSelectAvatarId(id)} />
        ))}
      </div>
      <div
        className={`fixed top-4 right-4 z-10 flex flex-col gap-2 transition-all duration-500 ${
          isCardOpen || isEndingTurn ? 'translate-x-[150%] opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-end text-sm font-semibold text-gray-900 dark:text-white">
          <span>{EnemyInfo.name}</span>
          <span className="text-xs font-normal">lvl {EnemyInfo.lvl}</span>
        </div>
        {enemyTeam.map(({ id, statistics }) => (
          <MiniCard key={id} hp={statistics.hp} onSelect={() => onSelectAvatarId(id)} />
        ))}
      </div>
      {activeAvatar && (
        <button
          className="fixed top-4 right-4 z-20 text-xs font-semibold text-[#d93900] dark:text-orange-500 cursor-pointer hover:underline"
          onClick={() => onSelectAvatarId(null)}
        >
          ← Back
        </button>
      )}
      {activeAvatar && (
        <FullCard
          avatar={activeAvatar}
          isEnemy={isActiveAvatarEnemy}
          isMoveMode={isMoveMode}
          isAttackMode={isAttackMode}
          isUtilitiesOpen={isUtilitiesOpen}
          onAttack={onAttack}
          onMove={onMove}
          onUtilities={() => setIsUtilitiesOpen(true)}
        />
      )}
      {activeAvatar && isUtilitiesOpen && (
        <SelectionPopup
          title="Utilities"
          items={activeAvatar.utilities}
          onSelectItem={() => setIsUtilitiesOpen(false)}
          onBack={() => setIsUtilitiesOpen(false)}
        />
      )}
      {isItemsOpen && (
        <SelectionPopup
          title="Items"
          items={UserInfo.items}
          onSelectItem={() => setIsItemsOpen(false)}
          onBack={() => setIsItemsOpen(false)}
        />
      )}

      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 transition-all duration-500 ${
          isEndingTurn ? 'translate-y-[150%] opacity-0' : 'opacity-100'
        }`}
      >
        {team.map(({ id, name, statistics }) => (
          <BottomTeamCard
            key={id}
            name={name}
            hp={statistics.hp}
            isActive={activeAvatarId === id}
            onSelect={() => onSelectAvatarId(id)}
          />
        ))}
      </div>

      <button
        className={`fixed bottom-4 right-4 z-10 transition-all duration-500 ${actionButtonClassName} ${
          isEndingTurn ? 'translate-y-[150%] opacity-0' : 'opacity-100'
        }`}
        onClick={handleEndTurn}
        disabled={isEndingTurn}
      >
        End Turn
      </button>
    </>
  );
};
