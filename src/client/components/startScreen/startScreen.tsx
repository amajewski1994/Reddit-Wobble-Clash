const modeButtonClassName =
  'game-button-primary flex flex-col items-center justify-center gap-2 w-40 h-40 text-lg font-bold uppercase tracking-wide';

export interface StartScreenProps {
  onSelectPick: () => void;
  onSelectCreate: () => void;
}

export const StartScreen = ({
  onSelectPick,
  onSelectCreate,
}: StartScreenProps) => (
  <div className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-10 bg-(--background)">
    <h1 className="text-3xl font-bold uppercase tracking-wide">Wobble Clash</h1>
    <div className="flex gap-6">
      <button className={modeButtonClassName} onClick={onSelectPick}>
        <span className="text-4xl">⚔️</span>
        Duel
      </button>
      <button className={modeButtonClassName} onClick={onSelectCreate}>
        <span className="text-4xl">🗺️</span>
        Create
      </button>
    </div>
  </div>
);
