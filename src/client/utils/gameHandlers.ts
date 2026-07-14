import type { Dispatch, SetStateAction } from 'react';
import { userTeam } from '../components/duelMode/teamsDate';
import { duelMapTilesData } from '../components/duelMode/duelMapTilesData';
import { getMaxHp } from './maxHp';
import {
  activateAbility,
  applyAbilityEffectToTarget,
  consumeAttackModifiers,
  decrementStatModifiers,
  getAbilityTargetType,
  getPassiveTurnStartHeal,
  isEndureActive,
} from './abilities';
import type { AttackOutcome } from '../types/duelMap';
import type { PlacedAvatar } from '../types/createMap';
import type { MapTileData } from '../types/mapTile';
import type { TeamMember } from '../types/team';

type GameHandlersDeps = {
  team: TeamMember[];
  setTeam: Dispatch<SetStateAction<TeamMember[]>>;
  enemyTeam: TeamMember[];
  setEnemyTeam: Dispatch<SetStateAction<TeamMember[]>>;
  activeAvatarId: number | null;
  setActiveAvatarId: Dispatch<SetStateAction<number | null>>;
  setIsMoveMode: Dispatch<SetStateAction<boolean>>;
  setIsAttackMode: Dispatch<SetStateAction<boolean>>;
  setSelectedAbilityName: Dispatch<SetStateAction<string | null>>;
  activeSlotIndex: number | null;
  setActiveSlotIndex: Dispatch<SetStateAction<number | null>>;
  selectedAvatarName: string | null;
  setSelectedAvatarName: Dispatch<SetStateAction<string | null>>;
  setPlacedAvatars: Dispatch<SetStateAction<(PlacedAvatar | null)[]>>;
  setCreateMapTiles: Dispatch<SetStateAction<MapTileData[]>>;
  setTurn: Dispatch<SetStateAction<number>>;
};

export const createGameHandlers = (deps: GameHandlersDeps) => {
  const {
    team,
    setTeam,
    enemyTeam,
    setEnemyTeam,
    setActiveAvatarId,
    setIsMoveMode,
    setIsAttackMode,
    setSelectedAbilityName,
    activeAvatarId,
    activeSlotIndex,
    setActiveSlotIndex,
    selectedAvatarName,
    setSelectedAvatarName,
    setPlacedAvatars,
    setCreateMapTiles,
    setTurn,
  } = deps;

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
    const applyDamage = (member: TeamMember) => {
      if (member.id !== targetId || outcome !== 'hit') return member;
      const nextHp = member.statistics.hp - damage;
      const hpFloor = isEndureActive(member) ? 1 : 0;
      return {
        ...member,
        statistics: { ...member.statistics, hp: Math.max(hpFloor, nextHp) },
      };
    };

    const applyApCost = (member: TeamMember) => {
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

    const applyEffects = (member: TeamMember, isPlayerArray: boolean) => {
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

    const applyDamage = (member: TeamMember) => {
      const result = results.find(({ targetId }) => targetId === member.id);
      if (!result || result.outcome !== 'hit') return member;
      const nextHp = member.statistics.hp - result.damage;
      const hpFloor = isEndureActive(member) ? 1 : 0;
      return {
        ...member,
        statistics: { ...member.statistics, hp: Math.max(hpFloor, nextHp) },
      };
    };

    const applyCasterUpdate = (member: TeamMember) => {
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
    const applyMove = (member: TeamMember) => {
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

    const applyMove = (member: TeamMember) => {
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
      prev.map((slot, index) =>
        index === slotIndex ? { tileID, avatarName } : slot
      )
    );
    setActiveSlotIndex(null);
    setSelectedAvatarName(null);
  };

  const handleRemoveAvatar = (index: number) => {
    setPlacedAvatars((prev) =>
      prev.map((slot, slotIndex) => (slotIndex === index ? null : slot))
    );
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
        tile.id === id
          ? { ...tile, rotationY: (tile.rotationY + delta + 360) % 360 }
          : tile
      )
    );
  };

  const decrementTurns = (turns: number | null) =>
    turns === null || turns <= 1 ? null : turns - 1;

  const decrementTurnBasedEffects = (member: TeamMember) => {
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

  return {
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
  };
};
