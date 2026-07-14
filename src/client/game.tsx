import './index.css';

import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navigateTo } from '@devvit/web/client';
import { useCounter } from './hooks/useCounter';
import { CreateMap } from './components/createMapMode/createMap';
import { CreateMapUI } from './components/createMapMode/createMapUI';
import { mapTilesData as initialCreateMapTiles } from './components/createMapMode/createMapTilesData';
import { DuelMap } from './components/duelMode/duelMap';
import { DuelMapUI } from './components/duelMode/duelMapUI';
import { StartScreen } from './components/startScreen/startScreen';
import {
  userTeam,
  enemyTeam as initialEnemyTeam,
} from './components/duelMode/teamsDate';
import { GameInfo } from './data/game';
import { TEAM_SLOT_COUNT, DEFAULT_MAP_TITLE } from './data/consts';
import { calculateMapRating } from './utils/mapRating';
import type { AttackOutcome } from './types/duelMap';
import type { PlacedAvatar } from './types/createMap';

type Screen = 'start' | 'duel' | 'create';

export const App = () => {
  // const { count, username, loading, increment, decrement } = useCounter();
  const [screen, setScreen] = useState<Screen>('start');
  const [selectedTileName, setSelectedTileName] = useState<string | null>(null);
  const [selectedAvatarName, setSelectedAvatarName] = useState<string | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [placedAvatars, setPlacedAvatars] = useState<(PlacedAvatar | null)[]>(
    Array(TEAM_SLOT_COUNT).fill(null)
  );
  const [createMapTiles, setCreateMapTiles] = useState(initialCreateMapTiles);
  const [mapTitle, setMapTitle] = useState(DEFAULT_MAP_TITLE);
  const [rotatingTileId, setRotatingTileId] = useState<number | null>(null);
  const [team, setTeam] = useState(userTeam);
  const [enemyTeam, setEnemyTeam] = useState(initialEnemyTeam);
  const [activeAvatarId, setActiveAvatarId] = useState<number | null>(null);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [isAttackMode, setIsAttackMode] = useState(false);
  const [turn, setTurn] = useState(GameInfo.turn);

  const handleSelectAvatarId = (id: number | null) => {
    setActiveAvatarId(id);
    setIsMoveMode(false);
    setIsAttackMode(false);
  };

  const handleMove = () => {
    setIsMoveMode(true);
    setIsAttackMode(false);
  };

  const handleAttack = () => {
    setIsAttackMode(true);
    setIsMoveMode(false);
  };

  const handleMoveAvatarToTile = (tileId: number) => {
    if (activeAvatarId === null) return;
    setTeam((prev) =>
      prev.map((member) =>
        member.id === activeAvatarId
          ? {
              ...member,
              tileID: tileId,
              statistics: {
                ...member.statistics,
                AP: Math.max(0, member.statistics.AP - 1),
              },
            }
          : member
      )
    );
    handleSelectAvatarId(null);
  };

  const handleAttackTile = (
    attackerId: number,
    targetId: number,
    damage: number,
    outcome: AttackOutcome
  ) => {
    const applyDamage = (member: (typeof team)[number]) => {
      if (member.id !== targetId || outcome !== 'hit') return member;
      const nextHp = member.statistics.hp - damage;
      return {
        ...member,
        statistics: { ...member.statistics, hp: nextHp <= 0 ? 0 : nextHp },
      };
    };

    const applyApCost = (member: (typeof team)[number]) => {
      if (member.id !== attackerId) return member;
      return {
        ...member,
        statistics: {
          ...member.statistics,
          AP: Math.max(0, member.statistics.AP - 1),
        },
      };
    };

    setTeam((prev) => prev.map(applyDamage).map(applyApCost));
    setEnemyTeam((prev) => prev.map(applyDamage).map(applyApCost));
    handleSelectAvatarId(null);
  };

  const handleAbilities = () => {
    if (activeAvatarId === null) return;
    setTeam((prev) =>
      prev.map((member) =>
        member.id === activeAvatarId
          ? {
              ...member,
              statistics: {
                ...member.statistics,
                AP: Math.max(0, member.statistics.AP - 1),
              },
            }
          : member
      )
    );
    handleSelectAvatarId(null);
  };

  const handlePlaceAvatar = (tileID: number) => {
    if (activeSlotIndex === null || !selectedAvatarName) return;
    const slotIndex = activeSlotIndex;
    const avatarName = selectedAvatarName;
    setPlacedAvatars((prev) =>
      prev.map((slot, index) => (index === slotIndex ? { tileID, avatarName } : slot))
    );
    setActiveSlotIndex(null);
    setSelectedAvatarName(null);
  };

  const handleRemoveAvatar = (index: number) => {
    setPlacedAvatars((prev) => prev.map((slot, slotIndex) => (slotIndex === index ? null : slot)));
    setActiveSlotIndex(null);
    setSelectedAvatarName(null);
  };

  const handleChangeTileName = (id: number, tileName: string) => {
    setCreateMapTiles((prev) =>
      prev.map((tile) => (tile.id === id ? { ...tile, tileName } : tile))
    );
  };

  const handleRotateCreateMapTile = (id: number, delta: number) => {
    setCreateMapTiles((prev) =>
      prev.map((tile) =>
        tile.id === id ? { ...tile, rotationY: (tile.rotationY + delta + 360) % 360 } : tile
      )
    );
  };

  const mapRating = useMemo(
    () => calculateMapRating(createMapTiles, placedAvatars, mapTitle),
    [createMapTiles, placedAvatars, mapTitle]
  );

  const handleEndTurn = () => {
    setTurn((prev) => prev + 1);
    setTeam((prev) =>
      prev.map((member) => {
        const initial = userTeam.find(({ id }) => id === member.id);
        return initial
          ? {
              ...member,
              statistics: { ...member.statistics, AP: initial.statistics.AP },
            }
          : member;
      })
    );
  };

  if (screen === 'start') {
    return (
      <StartScreen
        onSelectDuel={() => setScreen('duel')}
        onSelectCreate={() => setScreen('create')}
      />
    );
  }

  return (
    <div>
      {screen === 'create' && (
        <>
          <CreateMapUI
            selectedTileName={selectedTileName}
            onSelectTileName={setSelectedTileName}
            selectedAvatarName={selectedAvatarName}
            onSelectAvatarName={setSelectedAvatarName}
            placedAvatars={placedAvatars}
            activeSlotIndex={activeSlotIndex}
            onSelectSlot={setActiveSlotIndex}
            onRemoveAvatar={handleRemoveAvatar}
            mapTitle={mapTitle}
            onChangeMapTitle={setMapTitle}
            mapRating={mapRating}
            onResetRotation={() => setRotatingTileId(null)}
          />
          <CreateMap
            tiles={createMapTiles}
            selectedTileName={selectedTileName}
            onChangeTileName={handleChangeTileName}
            selectedAvatarName={selectedAvatarName}
            placedAvatars={placedAvatars}
            activeSlotIndex={activeSlotIndex}
            onPlaceAvatar={handlePlaceAvatar}
            rotatingTileId={rotatingTileId}
            onRotatingTileIdChange={setRotatingTileId}
            onRotateTile={handleRotateCreateMapTile}
          />
        </>
      )}

      {screen === 'duel' && (
        <>
          <DuelMapUI
            team={team}
            enemyTeam={enemyTeam}
            activeAvatarId={activeAvatarId}
            onSelectAvatarId={handleSelectAvatarId}
            isMoveMode={isMoveMode}
            isAttackMode={isAttackMode}
            onAttack={handleAttack}
            onMove={handleMove}
            onAbilities={handleAbilities}
            turn={turn}
            onEndTurn={handleEndTurn}
          />
          <DuelMap
            selectedTileName={selectedTileName}
            team={team}
            enemyTeam={enemyTeam}
            activeAvatarId={activeAvatarId}
            isMoveMode={isMoveMode}
            isAttackMode={isAttackMode}
            onMoveAvatarToTile={handleMoveAvatarToTile}
            onAttackTile={handleAttackTile}
          />
        </>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
