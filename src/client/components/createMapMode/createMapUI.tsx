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
          className="flex items-center justify-center bg-[#d93900] dark:bg-orange-600 text-white w-auto h-10 rounded-full cursor-pointer transition-colors px-4 hover:bg-[#c23300] dark:hover:bg-orange-700"
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
          className="flex items-center justify-center bg-[#d93900] dark:bg-orange-600 text-white w-auto h-10 rounded-full cursor-pointer transition-colors px-4 hover:bg-[#c23300] dark:hover:bg-orange-700"
          onClick={() => {
            setIsOpen(false);
            onSelectTileName(null);
            onResetRotation();
          }}
        >
          Wróć
        </button>
      </div>
      <div className="fixed top-1/2 right-4 -translate-y-1/2 z-10 flex flex-col items-center gap-2">
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#d93900] dark:bg-orange-600 text-white cursor-pointer transition-colors hover:bg-[#c23300] dark:hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d93900] dark:disabled:hover:bg-orange-600"
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
                    ? 'bg-[#d93900] dark:bg-orange-600 border-[#d93900] dark:border-orange-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-[#d93900] dark:border-orange-600 text-gray-900 dark:text-white'
                }`}
              >
                {abbreviateTileName(tileName)}
              </div>
            );
          })}
        </div>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#d93900] dark:bg-orange-600 text-white cursor-pointer transition-colors hover:bg-[#c23300] dark:hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d93900] dark:disabled:hover:bg-orange-600"
          onClick={() => scrollList(SCROLL_STEP)}
          disabled={!canScrollDown}
        >
          ▼
        </button>
      </div>
    </>
  );
};
