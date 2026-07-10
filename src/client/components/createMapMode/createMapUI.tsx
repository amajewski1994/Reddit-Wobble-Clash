import { useEffect, useRef, useState } from 'react';
import { TILE_NAMES, AVATAR_NAMES } from '../../data/consts';
import type { CreateMapUIProps } from '../../types/createMap';

const SCROLL_STEP = 80;

const abbreviateLabel = (name: string) => {
  const parts = name.split('-');
  if (parts.length > 1) {
    return parts.map((part) => part[0]).join('').toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const actionButtonClassName = 'game-button-primary flex items-center justify-center h-10 px-4';

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
    {avatarName ? abbreviateLabel(avatarName) : null}
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

export const CreateMapUI = ({
  selectedTileName,
  onSelectTileName,
  selectedAvatarName,
  onSelectAvatarName,
  placedAvatars,
  activeSlotIndex,
  onSelectSlot,
  onRemoveAvatar,
  onResetRotation,
}: CreateMapUIProps) => {
  const [isTilesOpen, setIsTilesOpen] = useState(false);
  const openPanel: Panel = isTilesOpen ? 'tiles' : activeSlotIndex !== null ? 'avatars' : null;

  const closePanel = () => {
    setIsTilesOpen(false);
    onSelectSlot(null);
    onSelectTileName(null);
    onSelectAvatarName(null);
    onResetRotation();
  };

  return (
    <>
      {!openPanel && (
        <div className="fixed top-1/2 right-4 -translate-y-1/2 z-10 flex flex-col gap-2">
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
      {openPanel && (
        <>
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-10">
            <button className={actionButtonClassName} onClick={closePanel}>
              Back
            </button>
          </div>
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
        </>
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
