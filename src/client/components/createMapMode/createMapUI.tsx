import { useEffect, useRef, useState } from 'react';
import { TILE_NAMES } from '../tileNames';
import type { MapUIProps } from '../../types/createMap';

const SCROLL_STEP = 80;

const abbreviateTileName = (tileName: string) => {
  const parts = tileName.split('-');
  if (parts.length > 1) {
    return parts.map((part) => part[0]).join('').toUpperCase();
  }
  return tileName.slice(0, 2).toUpperCase();
};

const actionButtonClassName = 'game-button-primary flex items-center justify-center h-10 px-4';

export const MapUI = ({ selectedTileName, onSelectTileName, onResetRotation }: MapUIProps) => {
  const [isOpen, setIsOpen] = useState(false);
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
    if (isOpen) {
      updateScrollState();
    }
  }, [isOpen]);

  const scrollList = (offset: number) => {
    listRef.current?.scrollBy({ top: offset, behavior: 'smooth' });
  };

  if (!isOpen) {
    return (
      <div className="fixed top-1/2 right-4 -translate-y-1/2 z-10">
        <button
          className={actionButtonClassName}
          onClick={() => {
            setIsOpen(true);
            onResetRotation();
          }}
        >
          Tiles
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-10">
        <button
          className={actionButtonClassName}
          onClick={() => {
            setIsOpen(false);
            onSelectTileName(null);
            onResetRotation();
          }}
        >
          Back
        </button>
      </div>
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
          {TILE_NAMES.map((tileName) => {
            const isSelected = selectedTileName === tileName;
            return (
              <div
                key={tileName}
                onClick={() => onSelectTileName(tileName)}
                className={`flex items-center justify-center w-16 h-16 shrink-0 rounded-full border-2 cursor-pointer transition-colors text-sm font-semibold ${
                  isSelected
                    ? 'bg-(--primary) border-(--primary) text-white'
                    : 'bg-(--panel-soft) border-(--panel-border)'
                }`}
              >
                {abbreviateTileName(tileName)}
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
    </>
  );
};
