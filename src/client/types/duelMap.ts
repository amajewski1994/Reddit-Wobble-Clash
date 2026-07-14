import type { TeamMember } from './team';

export interface DuelMapUIProps {
  team: TeamMember[];
  enemyTeam: TeamMember[];
  activeAvatarId: number | null;
  onSelectAvatarId: (id: number | null) => void;
  isMoveMode: boolean;
  isAttackMode: boolean;
  onAttack: () => void;
  onMove: () => void;
  selectedAbilityName: string | null;
  onSelectAbility: (name: string) => void;
  onCancelAbility: () => void;
  turn: number;
  onEndTurn: () => void;
}

export interface DuelMapProps {
  selectedTileName: string | null;
  team: TeamMember[];
  enemyTeam: TeamMember[];
  activeAvatarId: number | null;
  isMoveMode: boolean;
  isAttackMode: boolean;
  selectedAbilityName: string | null;
  onMoveAvatarToTile: (tileId: number) => void;
  onAttackTile: (
    attackerId: number,
    targetId: number,
    damage: number,
    outcome: AttackOutcome
  ) => void;
  onUseAbility: (
    casterId: number,
    abilityName: string,
    targetId: number
  ) => void;
  onUseAttackAbility: (
    casterId: number,
    abilityName: string,
    results: { targetId: number; damage: number; outcome: AttackOutcome }[]
  ) => void;
  onHitAndRunMove: (attackerId: number, tileId: number | null) => void;
  onUseMoveAbility: (
    casterId: number,
    abilityName: string,
    tileId: number
  ) => void;
}

export type AttackOutcome = 'hit' | 'dodge' | 'miss';

export type AvatarAction =
  | { type: 'attack'; targetX: number; targetZ: number }
  | { type: 'hurt'; outcome: AttackOutcome; damage: number; isDead: boolean }
  | {
      type: 'ability';
      playAnimation: boolean;
      animationClip: string;
      label: string | null;
    };

export type DuelActionEvent =
  | {
      kind: 'attack';
      attackerId: number;
      targetId: number;
      targetX: number;
      targetZ: number;
      damage: number;
      outcome: AttackOutcome;
      isDead: boolean;
    }
  | { kind: 'ability'; casterId: number; targetId: number; label: string };
