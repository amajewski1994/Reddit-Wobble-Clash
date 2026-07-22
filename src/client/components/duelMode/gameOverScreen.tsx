import type { TeamMember } from '../../../shared/types/team';
import { UserInfo } from '../../data/userInfo';
import { EnemyInfo } from '../../data/enemyInfo';
import { characters } from '../../data/characters';
import { getCharacterImageUrl } from '../../utils/characterImages';

export type GameResult = 'win' | 'lost';

export interface GameOverScreenProps {
  result: GameResult;
  team: TeamMember[];
  enemyTeam: TeamMember[];
  onBackToMenu: () => void;
}

const TeamSummary = ({
  name,
  members,
  isEnemy,
}: {
  name: string;
  members: TeamMember[];
  isEnemy: boolean;
}) => (
  <div
    className={`duel-panel ${isEnemy ? 'duel-panel--enemy' : 'duel-panel--team'} flex flex-col gap-2 w-48 p-3`}
  >
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-bold">{name}</span>
      {/* <span
        className={`text-[10px] font-semibold ${isEnemy ? 'text-(--danger)' : 'text-(--secondary)'}`}
      >
        lvl {lvl}
      </span> */}
    </div>
    <div className="flex flex-col gap-1.5">
      {members.map(({ id, name: memberName, characterId, statistics }) => {
        const character = characters.find(
          (candidate) => candidate.id === characterId
        );
        return (
          <div
            key={id}
            className={`flex items-center gap-2 rounded-md border border-(--panel-border) px-1.5 py-1 ${
              statistics.hp <= 0 ? 'opacity-40 grayscale' : ''
            }`}
          >
            {character ? (
              <img
                src={getCharacterImageUrl(character.image)}
                alt={memberName}
                className="w-7 h-7 shrink-0 rounded border border-(--panel-border) object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-7 h-7 shrink-0 rounded border border-dashed border-(--panel-border) text-base">
                {isEnemy ? '💀' : '🪖'}
              </div>
            )}
            <span className="text-xs font-semibold truncate">{memberName}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export const GameOverScreen = ({
  result,
  team,
  enemyTeam,
  onBackToMenu,
}: GameOverScreenProps) => {
  const isWin = result === 'win';

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-(--background)">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-4xl">{isWin ? '🏆' : '💀'}</span>
        <h1
          className={`text-2xl font-bold uppercase tracking-wide ${
            isWin ? 'text-(--success)' : 'text-(--danger)'
          }`}
        >
          {isWin ? 'Victory' : 'Defeat'}
        </h1>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-4">
        <TeamSummary name={UserInfo.name} members={team} isEnemy={false} />
        <TeamSummary name={EnemyInfo.name} members={enemyTeam} isEnemy />
      </div>

      <button
        className="game-button-primary duel-button-cut px-6 py-2 font-bold uppercase tracking-wide text-sm"
        onClick={onBackToMenu}
      >
        Back to Menu
      </button>
    </div>
  );
};
