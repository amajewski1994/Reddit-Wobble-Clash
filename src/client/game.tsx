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
import { PickModeCanvas } from './components/pickMode/pickModeCanvas';
import { PickModeUI } from './components/pickMode/pickModeUI';
import {
  userTeam,
  enemyTeam as initialEnemyTeam,
  setUserTeamFromCharacterIds,
} from './components/duelMode/teamsDate';
import { characters } from './data/characters';
import { GameInfo } from './data/game';
import {
  TEAM_SLOT_COUNT,
  DEFAULT_MAP_TITLE,
  PICK_TEAM_SIZE,
} from './data/consts';
import { calculateMapRating } from './utils/mapRating';
import { createGameHandlers } from './utils/gameHandlers';
import type { PlacedAvatar } from './types/createMap';

type Screen = 'start' | 'duel' | 'create' | 'pick';

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
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>(
    []
  );
  const [previewCharacterId, setPreviewCharacterId] = useState(
    characters[0]!.id
  );
  const [victoryToken, setVictoryToken] = useState(0);

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
    handleToggleCharacterSelection,
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
    setSelectedCharacterIds,
  });

  const previewCharacter =
    characters.find((character) => character.id === previewCharacterId) ??
    characters[0]!;

  const mapRating = useMemo(
    () => calculateMapRating(createMapTiles, placedAvatars, mapTitle),
    [createMapTiles, placedAvatars, mapTitle]
  );

  const leavePickMode = () => {
    setSelectedCharacterIds([]);
    setScreen('start');
  };

  const handlePickCharacter = (characterId: number) => {
    handleToggleCharacterSelection(characterId);
    setVictoryToken((token) => token + 1);
  };

  const handleConfirmPick = () => {
    setTeam(setUserTeamFromCharacterIds(selectedCharacterIds));
    setSelectedCharacterIds([]);
    setScreen('duel');
  };

  if (screen === 'start') {
    return (
      <StartScreen
        onSelectPick={() => setScreen('pick')}
        onSelectCreate={() => setScreen('create')}
      />
    );
  }

  return (
    <div>
      {screen === 'pick' && (
        <>
          <PickModeUI
            characters={characters}
            selectedCharacterIds={selectedCharacterIds}
            onToggleCharacter={handleToggleCharacterSelection}
            onPick={handlePickCharacter}
            previewCharacterId={previewCharacter.id}
            onPreviewCharacter={setPreviewCharacterId}
            onConfirm={handleConfirmPick}
            onBack={leavePickMode}
            maxTeamSize={PICK_TEAM_SIZE}
          />
          <PickModeCanvas character={previewCharacter} victoryToken={victoryToken} />
        </>
      )}

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
