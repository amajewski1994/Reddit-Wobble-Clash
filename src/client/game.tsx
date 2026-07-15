import './index.css';

import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navigateTo } from '@devvit/web/client';
import { useCounter } from './hooks/useCounter';
import { useAssetsLoading } from './hooks/useAssetsLoading';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { CreateMap } from './components/createMapMode/createMap';
import { CreateMapUI } from './components/createMapMode/createMapUI';
import { mapTilesData as initialCreateMapTiles } from './components/createMapMode/createMapTilesData';
import { DuelMap } from './components/duelMode/duelMap';
import { DuelMapUI } from './components/duelMode/duelMapUI';
import { EnemyTurn } from './components/duelMode/enemyTurn';
import { StartScreen } from './components/startScreen/startScreen';
import type { GameResult } from './components/duelMode/gameOverScreen';
import { GameOverScreen } from './components/duelMode/gameOverScreen';
import { PickModeCanvas } from './components/pickMode/pickModeCanvas';
import { PickModeUI } from './components/pickMode/pickModeUI';
import {
  userTeam,
  enemyTeam as initialEnemyTeam,
  setUserTeamFromCharacterIds,
  setEnemyTeamFromRandomCharacterIds,
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
import type { DuelActionEvent } from './types/duelMap';

type Screen = 'start' | 'duel' | 'create' | 'pick' | 'gameOver';

// Once a side is wiped out, the board stays up (frozen — see isDuelDecided
// below) for this long so the killing blow's hurt/death animation can play
// out before cutting to the summary screen.
const DEATH_ANIMATION_DELAY_MS = 5000;

// Shown between confirming a Pick Mode team and entering the duel screen.
const CONFIRM_PICK_LOADING_DELAY_MS = 5000;

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
  const [isEnemyTurn, setIsEnemyTurn] = useState(false);
  const [actionEvent, setActionEvent] = useState<DuelActionEvent | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>(
    []
  );
  const [previewCharacterId, setPreviewCharacterId] = useState(
    characters[0]!.id
  );
  const [victoryToken, setVictoryToken] = useState(0);
  const [isConfirmingPick, setIsConfirmingPick] = useState(false);
  const isAssetsLoading = useAssetsLoading();

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
    handleEnemyMoveToTile,
    handleAdvanceTurn,
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
    setIsEnemyTurn,
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

  const leaveCreateMode = () => {
    setSelectedTileName(null);
    setSelectedAvatarName(null);
    setActiveSlotIndex(null);
    setRotatingTileId(null);
    setScreen('start');
  };

  const handlePickCharacter = (characterId: number) => {
    handleToggleCharacterSelection(characterId);
    setVictoryToken((token) => token + 1);
  };

  const handleConfirmPick = () => {
    setTeam(setUserTeamFromCharacterIds(selectedCharacterIds));
    setEnemyTeam(setEnemyTeamFromRandomCharacterIds());
    setSelectedCharacterIds([]);
    setIsConfirmingPick(true);
  };

  useEffect(() => {
    if (!isConfirmingPick) return;
    const timeoutId = setTimeout(() => {
      setIsConfirmingPick(false);
      setScreen('duel');
    }, CONFIRM_PICK_LOADING_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [isConfirmingPick]);

  // Adjusting state during render (rather than in an effect) avoids an
  // extra commit — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  // Guarded by gameResult === null, so it only ever fires once per duel —
  // this only records the result and freezes the board (isDuelDecided
  // below); the actual switch to the gameOver screen is deferred (see the
  // effect below) so the death animation isn't cut off.
  if (screen === 'duel' && gameResult === null) {
    if (team.length > 0 && team.every(({ statistics }) => statistics.hp <= 0)) {
      setGameResult('lost');
    } else if (
      enemyTeam.length > 0 &&
      enemyTeam.every(({ statistics }) => statistics.hp <= 0)
    ) {
      setGameResult('win');
    }
  }

  const isDuelDecided = gameResult !== null;

  useEffect(() => {
    if (!gameResult) return;
    const timeoutId = setTimeout(
      () => setScreen('gameOver'),
      DEATH_ANIMATION_DELAY_MS
    );
    return () => clearTimeout(timeoutId);
  }, [gameResult]);

  const handleRestart = () => {
    setTeam([]);
    setEnemyTeam([]);
    setActiveAvatarId(null);
    setIsMoveMode(false);
    setIsAttackMode(false);
    setSelectedAbilityName(null);
    setTurn(GameInfo.turn);
    setIsEnemyTurn(false);
    setActionEvent(null);
    setGameResult(null);
    setSelectedCharacterIds([]);
    setPreviewCharacterId(characters[0]!.id);
    setVictoryToken(0);
    setIsConfirmingPick(false);
    setScreen('start');
  };

  if (screen === 'gameOver' && gameResult) {
    return (
      <GameOverScreen
        result={gameResult}
        team={team}
        enemyTeam={enemyTeam}
        onBackToMenu={handleRestart}
      />
    );
  }

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
      {(isAssetsLoading || isConfirmingPick) && <LoadingSpinner />}
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
            onBack={leaveCreateMode}
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
            isEnemyTurn={isEnemyTurn || isDuelDecided}
          />
          <DuelMap
            selectedTileName={selectedTileName}
            team={team}
            enemyTeam={enemyTeam}
            activeAvatarId={activeAvatarId}
            isMoveMode={isMoveMode}
            isAttackMode={isAttackMode}
            selectedAbilityName={selectedAbilityName}
            isEnemyTurn={isEnemyTurn || isDuelDecided}
            actionEvent={actionEvent}
            onActionEvent={setActionEvent}
            onMoveAvatarToTile={handleMoveAvatarToTile}
            onAttackTile={handleAttackTile}
            onUseAbility={handleUseAbility}
            onUseAttackAbility={handleUseAttackAbility}
            onHitAndRunMove={handleHitAndRunMove}
            onUseMoveAbility={handleUseMoveAbility}
          />
          <EnemyTurn
            isEnemyTurn={isEnemyTurn && !isDuelDecided}
            team={team}
            enemyTeam={enemyTeam}
            onMoveEnemy={handleEnemyMoveToTile}
            onAttackTile={handleAttackTile}
            onUseAbility={handleUseAbility}
            onUseAttackAbility={handleUseAttackAbility}
            onActionEvent={setActionEvent}
            onEnemyTurnEnd={handleAdvanceTurn}
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
