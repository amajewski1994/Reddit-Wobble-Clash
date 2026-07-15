import { useMemo } from 'react';
import { Avatar } from './Avatar';
import type { TeamMember } from '../../../shared/types/team';
import type { AvatarAction, DuelActionEvent } from '../../../shared/types/duelMap';
import type { MapTileData } from '../../../shared/types/mapTile';
import { getAbilityAnimationClip } from '../../utils/abilities';

export const AVATAR_Y_OFFSET = 0.225;

export const Avatars = ({
  team,
  tiles,
  actionEvent,
}: {
  team: TeamMember[];
  tiles: MapTileData[];
  actionEvent: DuelActionEvent | null;
}) => {
  const actionsById = useMemo(() => {
    const map = new Map<number, AvatarAction>();
    if (!actionEvent) return map;
    if (actionEvent.kind === 'attack') {
      map.set(actionEvent.attackerId, {
        type: 'attack',
        targetX: actionEvent.targetX,
        targetZ: actionEvent.targetZ,
      });
      map.set(actionEvent.targetId, {
        type: 'hurt',
        outcome: actionEvent.outcome,
        damage: actionEvent.damage,
        isDead: actionEvent.isDead,
      });
    } else {
      const isSelfTarget = actionEvent.casterId === actionEvent.targetId;
      const animationClip = getAbilityAnimationClip(actionEvent.label);
      map.set(actionEvent.casterId, {
        type: 'ability',
        playAnimation: true,
        animationClip,
        label: isSelfTarget ? actionEvent.label : null,
      });
      if (!isSelfTarget) {
        map.set(actionEvent.targetId, {
          type: 'ability',
          playAnimation: false,
          animationClip,
          label: actionEvent.label,
        });
      }
    }
    return map;
  }, [actionEvent]);

  return (
    <>
      {team.map(({ id, name, objectName, tileID, rotationY, scale }) => {
        const tile = tiles.find((tile) => tile.id === tileID);
        if (!tile) return null;
        return (
          <Avatar
            key={id}
            name={name}
            objectName={objectName}
            position={[tile.positionX, AVATAR_Y_OFFSET, tile.positionZ]}
            rotationY={rotationY}
            action={actionsById.get(id) ?? null}
            scale={scale}
          />
        );
      })}
    </>
  );
};
