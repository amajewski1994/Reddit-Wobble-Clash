import type { DuelMapUIProps } from '../../types/duelMap';
import type { TeamMember } from '../../types/team';

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

const MiniCard = ({ hp }: { hp: number }) => (
  <div
    className={`flex flex-col gap-1 w-20 rounded-md border-2 border-[#d93900] dark:border-orange-600 bg-white dark:bg-gray-900 p-1.5 transition-opacity ${
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
  isMoveMode,
  isAttackMode,
  onAttack,
  onMove,
  onUtilities,
}: {
  avatar: TeamMember;
  isMoveMode: boolean;
  isAttackMode: boolean;
  onAttack: () => void;
  onMove: () => void;
  onUtilities: () => void;
}) => {
  const isDead = avatar.hp <= 0;

  return (
    <div
      className={`fixed top-1/2 right-4 -translate-y-1/2 z-10 w-56 flex flex-col gap-3 rounded-lg border-2 border-[#d93900] dark:border-orange-600 bg-white dark:bg-gray-900 p-4 text-gray-900 dark:text-white transition-all duration-300 ${
        isMoveMode || isAttackMode ? 'translate-x-[calc(100%+1rem)]' : ''
      } ${isDead ? 'opacity-40 grayscale' : ''}`}
    >
      <div className="text-center font-semibold">{avatar.name}</div>
      <div className="flex items-center justify-center w-full h-32 rounded-md border-2 border-dashed border-[#d93900] dark:border-orange-600 text-xs text-gray-500 dark:text-gray-400">
        Zdjęcie
      </div>
      <div className="flex justify-between text-sm">
        <span>HP</span>
        <span>{avatar.hp}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>AP</span>
        <span>{avatar.AP}</span>
      </div>
      <div className="flex flex-col gap-2">
        <button className={actionButtonClassName} onClick={onAttack} disabled={avatar.AP === 0 || isDead}>
          Attack
        </button>
        <button className={actionButtonClassName} onClick={onMove} disabled={avatar.AP === 0 || isDead}>
          Move
        </button>
        <button
          className={actionButtonClassName}
          onClick={onUtilities}
          disabled={avatar.AP === 0 || isDead}
        >
          Utilities
        </button>
      </div>
    </div>
  );
};

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
  onUtilities,
}: DuelMapUIProps) => {
  const activeAvatar = team.find(({ id }) => id === activeAvatarId);
  const isCardOpen = !!activeAvatar;

  return (
    <>
      <div
        className={`fixed top-4 left-4 z-10 flex flex-col gap-2 transition-transform duration-300 ${
          isCardOpen ? 'translate-x-[-150%]' : ''
        }`}
      >
        {team.map(({ id, hp }) => (
          <MiniCard key={id} hp={hp} />
        ))}
      </div>
      <div
        className={`fixed top-4 right-4 z-10 flex flex-col gap-2 transition-transform duration-300 ${
          isCardOpen ? 'translate-x-[150%]' : ''
        }`}
      >
        {enemyTeam.map(({ id, hp }) => (
          <MiniCard key={id} hp={hp} />
        ))}
      </div>
      {activeAvatar && (
        <button
          className="fixed top-4 right-4 z-20 text-xs font-semibold text-[#d93900] dark:text-orange-500 cursor-pointer hover:underline"
          onClick={() => onSelectAvatarId(null)}
        >
          ← Wróć
        </button>
      )}
      {activeAvatar && (
        <FullCard
          avatar={activeAvatar}
          isMoveMode={isMoveMode}
          isAttackMode={isAttackMode}
          onAttack={onAttack}
          onMove={onMove}
          onUtilities={onUtilities}
        />
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {team.map(({ id, name, hp }) => (
          <BottomTeamCard
            key={id}
            name={name}
            hp={hp}
            isActive={activeAvatarId === id}
            onSelect={() => onSelectAvatarId(id)}
          />
        ))}
      </div>
    </>
  );
};
