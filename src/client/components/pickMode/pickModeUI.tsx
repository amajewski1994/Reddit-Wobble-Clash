import { useState } from 'react';
import type { PickModeUIProps } from '../../../shared/types/pickMode';
import type { AbilityCategory } from '../../../shared/types/characters';
import { abilities } from '../../data/abilities';
import { getCharacterImageUrl } from '../../utils/characterImages';
import { getAbilityCategoryIcon } from '../../utils/abilityIcons';
import { playSound } from '../../utils/sound';

const actionButtonLayoutClassName =
  'flex items-center justify-center h-10 px-4';
const actionButtonClassName = `game-button-primary ${actionButtonLayoutClassName}`;
const successButtonClassName = `game-button-success ${actionButtonLayoutClassName}`;

const AbilityCard = ({
  name,
  description,
  category,
  isPassive,
  cooldown,
}: {
  name: string;
  description: string;
  category: AbilityCategory;
  isPassive?: boolean;
  cooldown?: number | null;
}) => (
  <div className="duel-panel duel-panel--team flex flex-col items-center gap-2 w-28 p-2">
    <div className="flex items-center justify-center w-full h-20 rounded border border-(--panel-border) text-3xl">
      {getAbilityCategoryIcon(category)}
    </div>
    <span className="text-xs font-semibold text-center">{name}</span>
    <span className="text-[10px] text-center opacity-70">{description}</span>
    {isPassive ? (
      <span className="text-[10px] font-semibold uppercase game-label">
        Passive
      </span>
    ) : (
      typeof cooldown === 'number' && (
        <span className="text-[10px] game-label">Cooldown: {cooldown}</span>
      )
    )}
  </div>
);

export const PickModeUI = ({
  characters,
  selectedCharacterIds,
  onToggleCharacter,
  onPick,
  previewCharacterId,
  onPreviewCharacter,
  onConfirm,
  onBack,
  maxTeamSize,
}: PickModeUIProps) => {
  const previewIndex = characters.findIndex(
    (character) => character.id === previewCharacterId
  );
  const previewCharacter =
    previewIndex >= 0 ? characters[previewIndex] : characters[0];

  const goToOffset = (offset: number) => {
    if (characters.length === 0) return;
    const currentIndex = previewIndex >= 0 ? previewIndex : 0;
    const nextIndex =
      (currentIndex + offset + characters.length) % characters.length;
    const nextCharacter = characters[nextIndex];
    if (nextCharacter) onPreviewCharacter(nextCharacter.id);
  };

  const isPreviewSelected = previewCharacter
    ? selectedCharacterIds.includes(previewCharacter.id)
    : false;
  const isTeamFull = selectedCharacterIds.length >= maxTeamSize;
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isAbilitiesOpen, setIsAbilitiesOpen] = useState(false);
  const previewAbilities = previewCharacter
    ? abilities.find((entry) => entry.id === previewCharacter.abilitiesId)
    : undefined;

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <div className="duel-banner">
          <div className="duel-banner__inner px-8 py-2 text-base font-bold uppercase tracking-wide whitespace-nowrap">
            Pick Your Team
          </div>
        </div>
        {previewCharacter && (
          <button
            onClick={() => {
              playSound('button_action.mp3');
              onPick(previewCharacter.id);
            }}
            disabled={isPreviewSelected || isTeamFull}
            className={`${actionButtonLayoutClassName} rounded-md font-bold ${
              isPreviewSelected
                ? 'bg-(--success) text-white disabled:opacity-100'
                : 'game-button-primary disabled:opacity-40'
            }`}
          >
            {isPreviewSelected ? 'Picked' : 'Pick'}
          </button>
        )}
      </div>

      <button
        className={`game-button-secondary fixed top-4 right-4 z-10 flex items-center justify-center h-8 px-3 text-sm`}
        onClick={() => {
          playSound('button_cancel.mp3');
          onBack();
        }}
      >
        Menu
      </button>

      {characters.length > 1 && (
        <button
          className={`${actionButtonClassName} fixed top-1/2 left-4 -translate-y-1/2 z-10 w-10 h-10 px-0 text-lg`}
          onClick={() => goToOffset(-1)}
        >
          ◀
        </button>
      )}

      {characters.length > 1 && (
        <button
          className={`${actionButtonClassName} fixed top-1/2 right-4 -translate-y-1/2 z-10 w-10 h-10 px-0 text-lg`}
          onClick={() => goToOffset(1)}
        >
          ▶
        </button>
      )}

      {previewCharacter && (
        <div className="fixed top-1/5 sm:top-5 left-4 z-10 w-20 sm:w-40 flex flex-col items-center gap-1 sm:gap-2 p-1.5 sm:p-3 rounded-lg border border-(--panel-border) bg-(--panel)/40 backdrop-blur-sm">
          <img
            src={getCharacterImageUrl(previewCharacter.image)}
            alt={previewCharacter.name}
            className="w-full h-10 sm:h-20 rounded border border-(--panel-border) object-cover"
          />
          <span className="text-[10px] sm:text-base font-bold text-center leading-tight">
            {previewCharacter.name}
          </span>
          <span className="text-[8px] sm:text-xs uppercase tracking-wide text-(--muted) text-center leading-tight">
            {previewCharacter.class}
          </span>
          <button
            className="game-button-primary flex items-center justify-center w-full h-6 sm:h-10 px-1 text-[9px] sm:text-sm"
            onClick={() => setIsInfoOpen((prev) => !prev)}
          >
            {isInfoOpen ? 'Hide Info' : 'Show Info'}
          </button>
        </div>
      )}

      {isInfoOpen && previewCharacter && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/60"
          onClick={() => setIsInfoOpen(false)}
        >
          <div
            className="duel-panel duel-panel--team w-64 flex flex-col gap-1 p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-center font-bold flex-1">
                {previewCharacter.name}
              </span>
              <button
                className="text-(--muted) hover:text-(--foreground) text-sm font-bold leading-none"
                onClick={() => setIsInfoOpen(false)}
              >
                ✕
              </button>
            </div>
            <img
              src={getCharacterImageUrl(previewCharacter.image)}
              alt={previewCharacter.name}
              className="w-full h-32 rounded-md border-2 border-(--panel-border) object-cover"
            />
            <div className="flex justify-between text-sm">
              <span className="game-label">Class</span>
              <span>{previewCharacter.class}</span>
            </div>
            <p className="text-sm text-(--muted) border-t border-(--panel-border) pt-2">
              {previewCharacter.description}
            </p>
            <div className="flex flex-col gap-1 border-t border-(--panel-border) pt-2">
              <div className="flex justify-between text-sm">
                <span className="game-label">HP</span>
                <span>{previewCharacter.statistics.hp}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="game-label">Attack</span>
                <span>{previewCharacter.statistics.attack}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="game-label">Defence</span>
                <span>{previewCharacter.statistics.defence}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="game-label">AP</span>
                <span>{previewCharacter.statistics.AP}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="game-label">Dodge</span>
                <span>{previewCharacter.statistics.dodge}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="game-label">Accuracy</span>
                <span>{previewCharacter.statistics.accuracy}%</span>
              </div>
            </div>
            <button
              className="game-button-primary flex items-center justify-center w-full h-8 px-1 text-xs mt-1"
              onClick={() => setIsAbilitiesOpen(true)}
            >
              Abilities
            </button>
          </div>
        </div>
      )}

      {isAbilitiesOpen && previewCharacter && previewAbilities && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
          onClick={() => setIsAbilitiesOpen(false)}
        >
          <div
            className="duel-panel duel-panel--team w-80 flex flex-col gap-4 p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-center font-bold flex-1">
                {previewCharacter.name} — Abilities
              </span>
              <button
                className="text-(--muted) hover:text-(--foreground) text-sm font-bold leading-none"
                onClick={() => setIsAbilitiesOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <AbilityCard
                name={previewAbilities.abilities.passive.name}
                description={previewAbilities.abilities.passive.description}
                category={previewAbilities.abilities.passive.category}
                isPassive
              />
              {previewAbilities.abilities.active.map((ability) => (
                <AbilityCard
                  key={ability.name}
                  name={ability.name}
                  description={ability.description}
                  category={ability.category}
                  cooldown={ability.cooldown}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <div className="duel-banner">
          <div className="duel-banner__inner px-6 py-1.5 text-base font-bold uppercase tracking-wide">
            Your Team ({selectedCharacterIds.length}/{maxTeamSize})
          </div>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: maxTeamSize }).map((_, index) => {
            const characterId = selectedCharacterIds[index];
            const character = characters.find(
              (candidate) => candidate.id === characterId
            );
            return (
              <div
                key={index}
                onClick={() =>
                  character !== undefined && onToggleCharacter(character.id)
                }
                className={`flex items-center justify-center w-14 h-14 shrink-0 rounded-md border-2 text-sm font-semibold overflow-hidden ${
                  character
                    ? 'border-(--panel-border) bg-(--panel-soft) cursor-pointer'
                    : 'border-dashed border-(--panel-border) bg-(--panel-soft)'
                }`}
              >
                {character ? (
                  <img
                    src={getCharacterImageUrl(character.image)}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <button
          className={successButtonClassName}
          disabled={selectedCharacterIds.length !== maxTeamSize}
          onClick={() => {
            playSound('button_confirm.mp3');
            onConfirm();
          }}
        >
          Confirm
        </button>
      </div>
    </>
  );
};
