import type { Character } from '../../../shared/types/characters';

const modeButtonClassName =
  'game-button-primary flex flex-col items-center justify-center gap-2 w-40 h-40 text-lg font-bold uppercase tracking-wide';

export interface StartScreenProps {
  onSelectPick: () => void;
  onSelectCreate: () => void;
  showCreate: boolean;
  enemies: Character[];
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

export const StartScreen = ({
  onSelectPick,
  onSelectCreate,
  showCreate,
  enemies,
}: StartScreenProps) => (
  <div
    className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-10 bg-(--background) bg-cover bg-center"
    style={{
      backgroundImage:
        'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("/assets/splash%20-%20background.png")',
    }}
  >
    <img
      src="/assets/logo.png"
      alt="Wobble Clash"
      className="w-64 max-w-[60%] h-auto"
    />
    <div className="flex gap-6">
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
