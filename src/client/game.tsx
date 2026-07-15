import './index.css';

import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navigateTo } from '@devvit/web/client';
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
  setEnemyTeamFromPlacedAvatars,
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
import type { PlacedAvatar } from '../shared/types/createMap';
import type { DuelActionEvent } from '../shared/types/duelMap';

import { publishMap } from './api/publishMap';
import { getCurrentUser } from './api/getCurrentUser';
import { recordMapResult } from './api/recordMapResult';
import { UserInfo } from './data/userInfo';

import { duelMapTilesData } from './components/duelMode/duelMapTilesData';
import { loadCurrentMap } from './api/loadCurrentMap';
import { buildPublishedDuelTiles } from './utils/buildPublishedDuelTiles';

import type { MapStats, PublishedMap } from '../shared/types/savedMap';
import type { DuelMapTileData } from '../shared/types/mapTile';

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

  const [isSavingMap, setIsSavingMap] = useState(false);
  const [saveMapError, setSaveMapError] = useState<string | null>(null);

  const [activePublishedMap, setActivePublishedMap] = useState<PublishedMap | null>(null);
  const [mapStats, setMapStats] = useState<MapStats | null>(null);
  const [isLoadingPublishedMap, setIsLoadingPublishedMap] = useState(true);
  const hasRecordedResultRef = useRef(false);

const [, setPublishedMapLoadError] =
  useState<string | null>(null);

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

  const activePublishedMapEnemies = useMemo(() => {
    if (!activePublishedMap) return [];

    return activePublishedMap.enemies
      .map(({ avatarName }) =>
        characters.find((character) => character.name === avatarName)
      )
      .filter((character) => character !== undefined);
  }, [activePublishedMap]);

  const activeDuelTiles = useMemo<DuelMapTileData[]>(() => {
  if (!activePublishedMap) {
    return duelMapTilesData;
  }

  return buildPublishedDuelTiles(
    initialCreateMapTiles,
    activePublishedMap
  );
}, [activePublishedMap]);

useEffect(() => {
  let cancelled = false;

  const initializeFromCurrentPost = async (): Promise<void> => {
    try {
      const result = await loadCurrentMap();

      if (cancelled) return;

      if (result) {
        setActivePublishedMap(result.map);
        setMapStats(result.stats);
        setScreen('start');
      } else {
        setActivePublishedMap(null);
        setMapStats(null);
        setScreen('start');
      }
    } catch (error) {
      console.error('Could not load published map:', error);

      if (cancelled) return;

      setActivePublishedMap(null);
      setMapStats(null);
      setPublishedMapLoadError(
        error instanceof Error
          ? error.message
          : 'Nie udało się pobrać mapy.'
      );
      setScreen('start');
    } finally {
      if (!cancelled) {
        setIsLoadingPublishedMap(false);
      }
    }
  };

  void initializeFromCurrentPost();

  return () => {
    cancelled = true;
  };
}, []);

useEffect(() => {
  let cancelled = false;

  void getCurrentUser().then((username) => {
    if (!cancelled && username) {
      UserInfo.name = username;
    }
  });

  return () => {
    cancelled = true;
  };
}, []);

  const handleSaveMap = async (): Promise<void> => {
  if (isSavingMap) return;

  setIsSavingMap(true);
  setSaveMapError(null);

  try {
    const enemies: PlacedAvatar[] = placedAvatars.filter(
      (avatar): avatar is PlacedAvatar => avatar !== null
    );

    const result = await publishMap({
  title: mapTitle.trim(),
  rating: mapRating,
  tiles: createMapTiles.map(({ id, tileName, rotationY }) => ({
    id,
    tileName,
    rotationY,
  })),
  enemies,
});

    if (result.postUrl) {
      navigateTo(result.postUrl);
    }

    console.log('Mapa została opublikowana:', result.postId);
  } catch (error) {
    setSaveMapError(
      error instanceof Error
        ? error.message
        : 'Nie udało się opublikować mapy.'
    );
  } finally {
    setIsSavingMap(false);
  }
};

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
  try {
    if (activePublishedMap) {
      const occupiedEnemyTileIds = new Set(
        activePublishedMap.enemies.map(({ tileID }) => tileID)
      );

      const nextTeam = setUserTeamFromCharacterIds(
        selectedCharacterIds,
        activeDuelTiles,
        occupiedEnemyTileIds
      );

      const nextEnemyTeam = setEnemyTeamFromPlacedAvatars(
        activePublishedMap.enemies,
        activeDuelTiles
      );

      setTeam(nextTeam);
      setEnemyTeam(nextEnemyTeam);
    } else {
      setTeam(
        setUserTeamFromCharacterIds(selectedCharacterIds)
      );

      setEnemyTeam(
        setEnemyTeamFromRandomCharacterIds()
      );
    }

    setSelectedCharacterIds([]);
    setIsConfirmingPick(true);
  } catch (error) {
    console.error('Could not start duel:', error);

    setPublishedMapLoadError(
      error instanceof Error
        ? error.message
        : 'Nie udało się rozpocząć pojedynku.'
    );
  }
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

  useEffect(() => {
    if (!gameResult || hasRecordedResultRef.current || !activePublishedMap) {
      return;
    }
    hasRecordedResultRef.current = true;

    void recordMapResult(gameResult).then((stats) => {
      if (stats) setMapStats(stats);
    });
  }, [gameResult, activePublishedMap]);

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
    hasRecordedResultRef.current = false;
    setScreen('start');
  };

  if (isLoadingPublishedMap) {
  return <LoadingSpinner />;
}

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
        showCreate={!activePublishedMap}
        enemies={activePublishedMapEnemies}
        stats={mapStats}
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
  onSave={handleSaveMap}
  isSaving={isSavingMap}
  saveError={saveMapError}
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
          tiles={activeDuelTiles}
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
          tiles={activeDuelTiles}
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
          tiles={activeDuelTiles}
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
