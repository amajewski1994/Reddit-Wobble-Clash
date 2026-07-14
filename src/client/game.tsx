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
import { duelMapTilesData } from './components/duelMode/duelMapTilesData';
import { GameInfo } from './data/game';
import { TEAM_SLOT_COUNT, DEFAULT_MAP_TITLE } from './data/consts';
import { calculateMapRating } from './utils/mapRating';
import { getMaxHp } from './utils/maxHp';
import {
  activateAbility,
  applyAbilityEffectToTarget,
  consumeAttackModifiers,
  decrementStatModifiers,
  getAbilityTargetType,
  getPassiveTurnStartHeal,
  isEndureActive,
} from './utils/abilities';
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
  const [selectedAbilityName, setSelectedAbilityName] = useState<
    string | null
  >(null);
  const [turn, setTurn] = useState(GameInfo.turn);

  const handleSelectAvatarId = (id: number | null) => {
    setActiveAvatarId(id);
    setIsMoveMode(false);
    setIsAttackMode(false);
    setSelectedAbilityName(null);
  };

  const handleMove = () => {
    setIsMoveMode(true);
    setIsAttackMode(false);
    setSelectedAbilityName(null);
  };

  const handleAttack = () => {
    setIsAttackMode(true);
    setIsMoveMode(false);
    setSelectedAbilityName(null);
  };

  const handleSelectAbility = (name: string) => {
    setSelectedAbilityName(name);
    setIsMoveMode(false);
    setIsAttackMode(false);
  };

  const handleCancelAbility = () => {
    setSelectedAbilityName(null);
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
      const hpFloor = isEndureActive(member) ? 1 : 0;
      return {
        ...member,
        statistics: { ...member.statistics, hp: Math.max(hpFloor, nextHp) },
      };
    };

    const applyApCost = (member: (typeof team)[number]) => {
      if (member.id !== attackerId) return member;
      return {
        ...consumeAttackModifiers(member),
        hasAttacked: true,
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

  const handleUseAbility = (
    casterId: number,
    abilityName: string,
    targetId: number
  ) => {
    const caster = [...team, ...enemyTeam].find(({ id }) => id === casterId);
    const ability = caster?.abilities.active.find(
      ({ name }) => name === abilityName
    );
    if (!ability) return;

    const targetType = getAbilityTargetType(ability);
    const casterIsPlayer = team.some(({ id }) => id === casterId);

    const applyEffects = (
      member: (typeof team)[number],
      isPlayerArray: boolean
    ) => {
      let next = member;

      const isRecipient =
        targetType === 'allies'
          ? isPlayerArray === casterIsPlayer && member.statistics.hp > 0
          : member.id === targetId && targetId !== casterId;

      if (isRecipient) next = applyAbilityEffectToTarget(next, ability);
      if (member.id === casterId) next = activateAbility(next, ability);
      return next;
    };

    setTeam((prev) => prev.map((member) => applyEffects(member, true)));
    setEnemyTeam((prev) => prev.map((member) => applyEffects(member, false)));
    setSelectedAbilityName(null);
    handleSelectAvatarId(null);
  };

  const handleUseAttackAbility = (
    casterId: number,
    abilityName: string,
    results: { targetId: number; damage: number; outcome: AttackOutcome }[]
  ) => {
    const caster = [...team, ...enemyTeam].find(({ id }) => id === casterId);
    const ability = caster?.abilities.active.find(
      ({ name }) => name === abilityName
    );
    if (!ability) return;

    const applyDamage = (member: (typeof team)[number]) => {
      const result = results.find(({ targetId }) => targetId === member.id);
      if (!result || result.outcome !== 'hit') return member;
      const nextHp = member.statistics.hp - result.damage;
      const hpFloor = isEndureActive(member) ? 1 : 0;
      return {
        ...member,
        statistics: { ...member.statistics, hp: Math.max(hpFloor, nextHp) },
      };
    };

    const applyCasterUpdate = (member: (typeof team)[number]) => {
      if (member.id !== casterId) return member;
      return activateAbility(
        { ...consumeAttackModifiers(member), hasAttacked: true },
        ability
      );
    };

    setTeam((prev) => prev.map(applyDamage).map(applyCasterUpdate));
    setEnemyTeam((prev) => prev.map(applyDamage).map(applyCasterUpdate));
    setSelectedAbilityName(null);
    handleSelectAvatarId(null);
  };

  const handleHitAndRunMove = (attackerId: number, tileId: number | null) => {
    const applyMove = (member: (typeof team)[number]) => {
      if (member.id !== attackerId) return member;
      return {
        ...member,
        tileID: tileId ?? member.tileID,
        hitAndRunPending: false,
      };
    };

    setTeam((prev) => prev.map(applyMove));
    setEnemyTeam((prev) => prev.map(applyMove));
  };

  const handleUseMoveAbility = (
    casterId: number,
    abilityName: string,
    tileId: number
  ) => {
    const caster = [...team, ...enemyTeam].find(({ id }) => id === casterId);
    const ability = caster?.abilities.active.find(
      ({ name }) => name === abilityName
    );
    if (!ability) return;

    const applyMove = (member: (typeof team)[number]) => {
      if (member.id !== casterId) return member;
      return activateAbility({ ...member, tileID: tileId }, ability);
    };

    setTeam((prev) => prev.map(applyMove));
    setEnemyTeam((prev) => prev.map(applyMove));
    setSelectedAbilityName(null);
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

  const decrementTurns = (turns: number | null) =>
    turns === null || turns <= 1 ? null : turns - 1;

  const decrementTurnBasedEffects = (member: (typeof team)[number]) => {
    // Natural Recovery / Nature's Blessing tick once per handleEndTurn.
    const tileName =
      duelMapTilesData.find((tile) => tile.id === member.tileID)?.tileName ??
      '';
    const turnStartHeal =
      member.statistics.hp > 0
        ? getPassiveTurnStartHeal(member, tileName)
        : 0;

    return {
      ...member,
      abilityCooldowns: Object.fromEntries(
        Object.entries(member.abilityCooldowns).map(([name, turns]) => [
          name,
          Math.max(0, turns - 1),
        ])
      ),
      statModifiers: decrementStatModifiers(member.statModifiers),
      bonusesSuppressedTurns: decrementTurns(member.bonusesSuppressedTurns),
      protectTurnsRemaining: decrementTurns(member.protectTurnsRemaining),
      damageImmuneTurnsRemaining: decrementTurns(
        member.damageImmuneTurnsRemaining
      ),
      endureTurnsRemaining: decrementTurns(member.endureTurnsRemaining),
      statistics: {
        ...member.statistics,
        hp: Math.min(getMaxHp(member.id), member.statistics.hp + turnStartHeal),
      },
    };
  };

  const handleEndTurn = () => {
    setTurn((prev) => prev + 1);
    setTeam((prev) =>
      prev
        .map((member) => {
          const initial = userTeam.find(({ id }) => id === member.id);
          return initial
            ? {
                ...member,
                statistics: { ...member.statistics, AP: initial.statistics.AP },
              }
            : member;
        })
        .map(decrementTurnBasedEffects)
    );
    setEnemyTeam((prev) => prev.map(decrementTurnBasedEffects));
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
