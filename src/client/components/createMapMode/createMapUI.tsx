import { useEffect, useRef, useState } from 'react';
import { TILE_NAMES, DEFAULT_MAP_TITLE } from '../../data/consts';
import { characters } from '../../data/characters';
import type { CreateMapUIProps } from '../../../shared/types/createMap';

const AVATAR_NAMES = characters.map((character) => character.name);

const SCROLL_STEP = 80;

const abbreviateLabel = (name: string) => {
  const parts = name.split('-');
  if (parts.length > 1) {
    return parts
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const actionButtonLayoutClassName =
  'flex items-center justify-center h-10 px-4';
const actionButtonClassName = `game-button-primary ${actionButtonLayoutClassName}`;
const successButtonClassName = `game-button-success ${actionButtonLayoutClassName}`;

const MAX_MAP_RATING = 5;
const MIN_SAVE_RATING_STARS = 3;

const MapRatingStars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5 text-sm leading-none">
    {Array.from({ length: MAX_MAP_RATING }, (_, index) => (
      <span
        key={index}
        className={index < Math.round(rating) ? 'text-(--warning)' : 'text-(--muted-dark)'}
      >
        ★
      </span>
    ))}
  </div>
);

const ScrollableSelectList = ({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string | null;
  onSelect: (name: string) => void;
}) => {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const updateScrollState = () => {
    const el = listRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 0);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  };

  useEffect(() => {
    updateScrollState();
  }, []);

  const scrollList = (offset: number) => {
    listRef.current?.scrollBy({ top: offset, behavior: 'smooth' });
  };

  return (
    <div className="fixed top-1/2 right-4 -translate-y-1/2 z-10 flex flex-col items-center gap-2">
      <button
        className={`${actionButtonClassName} w-8 h-8 px-0`}
        onClick={() => scrollList(-SCROLL_STEP)}
        disabled={!canScrollUp}
      >
        ▲
      </button>
      <div
        ref={listRef}
        onScroll={updateScrollState}
        className="flex flex-col items-center gap-3 max-h-[70vh] overflow-y-auto p-1 scrollbar-none"
      >
        {items.map((name) => {
          const isSelected = selected === name;
          return (
            <div
              key={name}
              onClick={() => onSelect(name)}
              className={`flex items-center justify-center w-16 h-16 shrink-0 rounded-full border-2 cursor-pointer transition-colors text-sm font-semibold ${
                isSelected
                  ? 'bg-(--primary) border-(--primary) text-white'
                  : 'bg-(--panel-soft) border-(--panel-border)'
              }`}
            >
              {abbreviateLabel(name)}
            </div>
          );
        })}
      </div>
      <button
        className={`${actionButtonClassName} w-8 h-8 px-0`}
        onClick={() => scrollList(SCROLL_STEP)}
        disabled={!canScrollDown}
      >
        ▼
      </button>
    </div>
  );
};

const BottomTeamSlot = ({
  avatarName,
  isActive,
  onClick,
  onRemove,
}: {
  avatarName: string | null;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}) => (
  <div
    onClick={onClick}
    className={`relative flex items-center justify-center w-14 h-14 shrink-0 rounded-md border-2 cursor-pointer transition-colors text-sm font-semibold ${
      isActive
        ? 'border-(--primary) bg-(--panel-soft)'
        : avatarName
          ? 'border-(--panel-border) bg-(--panel-soft)'
          : 'border-dashed border-(--panel-border) bg-(--panel-soft)'
    }`}
  >
    {avatarName ? abbreviateLabel(avatarName) : <span className="text-(--muted)">Tap</span>}
    {isActive && avatarName && (
      <button
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-(--danger) text-white text-xs font-bold leading-none"
      >
        ✕
      </button>
    )}
  </div>
);

type Panel = 'tiles' | 'avatars' | null;

const MIN_TITLE_LENGTH = 1;
const MAX_TITLE_LENGTH = 20;

export const CreateMapUI = ({
  selectedTileName,
  onSelectTileName,
  selectedAvatarName,
  onSelectAvatarName,
  placedAvatars,
  activeSlotIndex,
  onSelectSlot,
  onRemoveAvatar,
  mapTitle,
  onChangeMapTitle,
  mapRating,
  onResetRotation,
  onSave,
  isSaving,
  saveError,
  onBack,
}: CreateMapUIProps) => {
  const [isTilesOpen, setIsTilesOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(mapTitle);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const openPanel: Panel = isTilesOpen
    ? 'tiles'
    : activeSlotIndex !== null
      ? 'avatars'
      : null;

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  const closePanel = () => {
    setIsTilesOpen(false);
    onSelectSlot(null);
    onSelectTileName(null);
    onSelectAvatarName(null);
    onResetRotation();
  };

  const startEditingTitle = () => {
    setTitleDraft(mapTitle);
    setIsEditingTitle(true);
  };

  const commitTitle = () => {
    const trimmed = titleDraft.trim().slice(0, MAX_TITLE_LENGTH);
    onChangeMapTitle(
      trimmed.length >= MIN_TITLE_LENGTH ? trimmed : DEFAULT_MAP_TITLE
    );
    setIsEditingTitle(false);
  };

  return (
    <>
      <button
        className="game-button-secondary fixed top-4 right-4 z-10 flex items-center justify-center h-8 px-3 text-sm"
        onClick={onBack}
      >
        Back
      </button>
      <div className="fixed top-1/5 left-4 z-10 game-panel opacity-75 flex flex-col items-start gap-1 px-4 py-3">
        <span className="game-label">Map Rating</span>
        <MapRatingStars rating={mapRating} />
      </div>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitTitle();
              if (event.key === 'Escape') setIsEditingTitle(false);
            }}
            maxLength={MAX_TITLE_LENGTH}
            className="bg-(--panel-soft) border-2 border-(--primary) rounded-md px-6 py-1.5 text-base font-bold uppercase tracking-wide text-center outline-none"
          />
        ) : (
          <div
            className="duel-banner cursor-pointer"
            onClick={startEditingTitle}
          >
            <div className="duel-banner__inner px-8 py-2 text-base font-bold uppercase tracking-wide whitespace-nowrap">
              {mapTitle}
            </div>
          </div>
        )}
        {openPanel ? (
          <button className={actionButtonClassName} onClick={closePanel}>
            Back
          </button>
        ) : (
          <button
            type="button"
            className={successButtonClassName}
            onClick={() => void onSave()}
            disabled={
              isSaving ||
              placedAvatars.some((slot) => slot === null) ||
              Math.round(mapRating) < MIN_SAVE_RATING_STARS
            }
          >
            {isSaving ? 'Publishing...' : 'Save & Publish'}
          </button>
        )}

        {saveError && (
  <div className="game-panel px-3 py-2 text-sm text-(--danger)">
    {saveError}
  </div>
)}
      </div>
      {!openPanel && (
        <div className="fixed top-1/5 right-4 z-10 flex flex-col gap-2">
          <button
            className={actionButtonClassName}
            onClick={() => {
              setIsTilesOpen(true);
              onResetRotation();
            }}
          >
            Tiles
          </button>
        </div>
      )}
      {openPanel === 'tiles' && (
        <ScrollableSelectList
          items={TILE_NAMES}
          selected={selectedTileName}
          onSelect={onSelectTileName}
        />
      )}
      {openPanel === 'avatars' && (
        <ScrollableSelectList
          items={AVATAR_NAMES}
          selected={selectedAvatarName}
          onSelect={onSelectAvatarName}
        />
      )}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <div className="duel-banner">
          <div className="duel-banner__inner px-6 py-1.5 text-base font-bold uppercase tracking-wide text-(--danger)">
            Enemies
          </div>
        </div>
        <div className="flex gap-2">
          {placedAvatars.map((slot, index) => (
            <BottomTeamSlot
              key={index}
              avatarName={slot?.avatarName ?? null}
              isActive={activeSlotIndex === index}
              onClick={() => onSelectSlot(index)}
              onRemove={() => onRemoveAvatar(index)}
            />
          ))}
        </div>
      </div>
    </>
  );
};
