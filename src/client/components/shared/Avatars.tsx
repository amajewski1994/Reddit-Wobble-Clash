import { useMemo } from 'react';
import { Avatar } from './Avatar';
import type { TeamMember } from '../../types/team';
import type { AvatarAction } from '../../types/duelMap';
import type { MapTileData } from '../../types/mapTile';

const AVATAR_Y_OFFSET = 0.225;

export const Avatars = ({
  team,
  tiles,
  attackEvent,
}: {
  team: TeamMember[];
  tiles: MapTileData[];
  attackEvent: {
    attackerId: number;
    targetId: number;
    targetX: number;
    targetZ: number;
    damage: number;
  } | null;
}) => {
  const actionsById = useMemo(() => {
    const map = new Map<number, AvatarAction>();
    if (attackEvent) {
      map.set(attackEvent.attackerId, {
        type: 'attack',
        targetX: attackEvent.targetX,
        targetZ: attackEvent.targetZ,
      });
      map.set(attackEvent.targetId, { type: 'hurt', damage: attackEvent.damage });
    }
    return map;
  }, [attackEvent]);

  return (
    <>
      {team.map(({ id, name, tileID, rotationY }) => {
        const tile = tiles.find((tile) => tile.id === tileID);
        if (!tile) return null;
        return (
          <Avatar
            key={id}
            name={name}
            position={[tile.positionX, AVATAR_Y_OFFSET, tile.positionZ]}
            rotationY={rotationY}
            action={actionsById.get(id) ?? null}
          />
        );
      })}
    </>
  );
};
