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
  onUtilities: () => void;
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
  onMoveAvatarToTile: (tileId: number) => void;
  onAttackTile: (
    attackerId: number,
    targetId: number,
    damage: number,
    outcome: AttackOutcome
  ) => void;
}

export type AttackOutcome = 'hit' | 'dodge' | 'miss';

export type AvatarAction =
  | { type: 'attack'; targetX: number; targetZ: number }
  | { type: 'hurt'; outcome: AttackOutcome; damage: number; isDead: boolean };
