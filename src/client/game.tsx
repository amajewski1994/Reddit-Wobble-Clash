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
import { createGameHandlers } from './utils/gameHandlers';
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
  const [selectedAbilityName, setSelectedAbilityName] = useState<
    string | null
  >(null);
  const [turn, setTurn] = useState(GameInfo.turn);

  const {
    handleSelectAvatarId,
    handleMove,
    handleAttack,
    handleSelectAbility,
    handleCancelAbility,
    handleMoveAvatarToTile,
    handleAttackTile,
    handleUseAbility,
    handleUseAttackAbility,
    handleHitAndRunMove,
    handleUseMoveAbility,
    handlePlaceAvatar,
    handleRemoveAvatar,
    handleChangeTileName,
    handleRotateCreateMapTile,
    handleEndTurn,
  } = createGameHandlers({
    team,
    setTeam,
    enemyTeam,
    setEnemyTeam,
    activeAvatarId,
    setActiveAvatarId,
    setIsMoveMode,
    setIsAttackMode,
    setSelectedAbilityName,
    activeSlotIndex,
    setActiveSlotIndex,
    selectedAvatarName,
    setSelectedAvatarName,
    setPlacedAvatars,
    setCreateMapTiles,
    setTurn,
  });

  const mapRating = useMemo(
    () => calculateMapRating(createMapTiles, placedAvatars, mapTitle),
    [createMapTiles, placedAvatars, mapTitle]
  );

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
            selectedAbilityName={selectedAbilityName}
            onSelectAbility={handleSelectAbility}
            onCancelAbility={handleCancelAbility}
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
            selectedAbilityName={selectedAbilityName}
            onMoveAvatarToTile={handleMoveAvatarToTile}
            onAttackTile={handleAttackTile}
            onUseAbility={handleUseAbility}
            onUseAttackAbility={handleUseAttackAbility}
            onHitAndRunMove={handleHitAndRunMove}
            onUseMoveAbility={handleUseMoveAbility}
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
