import type { Character } from '../../../shared/types/characters';
import type { MapStats } from '../../../shared/types/savedMap';

const modeButtonClassName =
  'game-button-primary flex flex-col items-center justify-center gap-2 w-40 h-40 text-lg font-bold uppercase tracking-wide';

export interface StartScreenProps {
  onSelectPick: () => void;
  onSelectCreate: () => void;
  showCreate: boolean;
  enemies: Character[];
  stats: MapStats | null;
}

const EnemyPreview = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center gap-1 w-16">
    <div className="flex items-center justify-center w-16 h-16 rounded-md border-2 border-dashed border-(--panel-border) bg-(--panel-soft) text-2xl opacity-80">
      💀
    </div>
    <span className="text-[10px] font-semibold text-center leading-tight text-white">
      {name}
    </span>
  </div>
);

const StatTile = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between gap-3 w-28">
    <span className="text-[10px] uppercase tracking-wide text-(--muted)">
      {label}
    </span>
    <span className="text-sm font-bold text-white">{value}</span>
  </div>
);

export const StartScreen = ({
  onSelectPick,
  onSelectCreate,
  showCreate,
  enemies,
  stats,
}: StartScreenProps) => (
  <div
    className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-10 bg-(--background) bg-cover bg-center"
    style={{
      backgroundImage:
        'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("/assets/images/splash%20-%20background.png")',
    }}
  >
    <img
      src="/assets/images/logo.png"
      alt="Wobble Clash"
      className="w-64 max-w-[60%] h-auto"
    />
    <div className="flex items-center gap-6">
      <button className={modeButtonClassName} onClick={onSelectPick}>
        <span className="text-4xl">⚔️</span>
        Duel
      </button>
      {showCreate && (
        <button className={modeButtonClassName} onClick={onSelectCreate}>
          <span className="text-4xl">🗺️</span>
          Create
        </button>
      )}
    </div>
    {stats && (
      <div className="fixed top-1/2 right-6 -translate-y-1/2 z-10 game-panel opacity-75 flex flex-col items-start gap-2 px-4 py-3">
        <span className="game-label text-sm uppercase tracking-wide text-white">
          Map statistics
        </span>
        <div className="flex flex-col gap-1.5">
          <StatTile label="Played" value={stats.played} />
          <StatTile label="User Wins" value={stats.wins} />
          <StatTile label="User Losses" value={stats.losses} />
        </div>
      </div>
    )}
    {enemies.length > 0 && (
      <div className="flex flex-col items-center gap-2">
        <span className="game-label text-sm uppercase tracking-wide text-white">
          Enemies
        </span>
        <div className="flex gap-3">
          {enemies.map((enemy) => (
            <EnemyPreview key={enemy.id} name={enemy.name} />
          ))}
        </div>
      </div>
    )}
  </div>
);
