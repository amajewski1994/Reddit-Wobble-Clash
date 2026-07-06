import { Canvas, extend, ThreeElement, ThreeEvent, useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  CanvasTexture,
  LoopOnce,
  Material,
  Mesh,
  Object3D,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { clone as cloneSkinnedScene } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { duelMapTilesData as initialMapTilesData } from './duelMapTilesData';
import { userTeam, enemyTeam, type TeamMember } from './teamsDate';
import { TILE_NAMES } from '../tileNames';

const TILE_PATHS = TILE_NAMES.map((name) => `/assets/tiles/${name}.glb`);
const ROTATE_LEFT_ICON = '/assets/images/curve-up-arrow.png';
const ROTATE_RIGHT_ICON = '/assets/images/curve-down-arrow.png';
const AVATAR_PATHS = [...userTeam, ...enemyTeam].map(({ name }) => `/assets/characters/${name}.glb`);
const AVATAR_Y_OFFSET = 0.225;

TILE_PATHS.forEach((path) => useLoader.preload(GLTFLoader, path));
useLoader.preload(TextureLoader, ROTATE_LEFT_ICON);
useLoader.preload(TextureLoader, ROTATE_RIGHT_ICON);
AVATAR_PATHS.forEach((path) => useLoader.preload(GLTFLoader, path));

extend({ OrbitControls });

declare module '@react-three/fiber' {
  interface ThreeElements {
    orbitControls: ThreeElement<typeof OrbitControls>;
  }
}

const CameraControls = () => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls>(null);

  useEffect(() => {
    controlsRef.current?.update();
  }, []);

  return <orbitControls ref={controlsRef} args={[camera, gl.domElement]} enableDamping />;
};

const Tile = ({
  position,
  rotation,
  name,
  onClick,
  dimmed,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  name?: string;
  onClick?: (() => void) | undefined;
  dimmed?: boolean;
}) => {
  const path = `/assets/tiles/${name}.glb`;
  const gltf = useLoader(GLTFLoader, path);
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone();
    cloned.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = Array.isArray(child.material)
          ? child.material.map((material) => material.clone())
          : child.material.clone();
      }
    });
    return cloned;
  }, [gltf]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        const materials: Material[] = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((material) => {
          material.transparent = true;
          material.opacity = dimmed ? 0.1 : 1;
          material.needsUpdate = true;
        });
      }
    });
  }, [scene, dimmed]);

  return <primitive object={scene} position={position} rotation={rotation} onClick={onClick} />;
};

const ROTATE_DURATION = 0.3;
const MOVE_DURATION = 0.8;
const HURT_DELAY = 1;
const DAMAGE_NUMBER_DURATION = 1;
const DAMAGE_NUMBER_RISE = 0.8;

const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

type AvatarAction =
  | { type: 'attack'; targetX: number; targetZ: number }
  | { type: 'hurt'; damage: number };

const createDamageTexture = (damage: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext('2d')!;
  context.font = 'bold 40px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineWidth = 6;
  context.strokeStyle = '#000000';
  context.strokeText(`-${damage}`, canvas.width / 2, canvas.height / 2);
  context.fillStyle = '#ff3b30';
  context.fillText(`-${damage}`, canvas.width / 2, canvas.height / 2);
  return new CanvasTexture(canvas);
};

const DamageNumber = ({
  damage,
  origin,
  onComplete,
}: {
  damage: number;
  origin: [number, number, number];
  onComplete: () => void;
}) => {
  const spriteRef = useRef<Sprite>(null!);
  const texture = useMemo(() => createDamageTexture(damage), [damage]);
  const elapsedRef = useRef(0);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const t = Math.min(elapsedRef.current / DAMAGE_NUMBER_DURATION, 1);
    spriteRef.current.position.set(origin[0], origin[1] + DAMAGE_NUMBER_RISE * t, origin[2]);
    const material = spriteRef.current.material as SpriteMaterial;
    material.opacity = 1 - t;
    if (t >= 1) onComplete();
  });

  return (
    <sprite ref={spriteRef} position={origin} scale={[0.8, 0.4, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
};

const Avatar = ({
  name,
  position,
  rotationY,
  action,
}: {
  name: string;
  position: [number, number, number];
  rotationY: number;
  action: AvatarAction | null;
}) => {
  const path = `/assets/characters/${name}.glb`;
  const gltf = useLoader(GLTFLoader, path);
  const scene = useMemo(() => cloneSkinnedScene(gltf.scene), [gltf]);
  const groupRef = useRef<Object3D>(null!);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const actionsRef = useRef<{
    idle: AnimationAction | undefined;
    run: AnimationAction | undefined;
    attack: AnimationAction | undefined;
    hurt: AnimationAction | undefined;
  }>({
    idle: undefined,
    run: undefined,
    attack: undefined,
    hurt: undefined,
  });
  const moveRef = useRef<{
    phase: 'rotating' | 'moving';
    fromRotation: number;
    rotationDelta: number;
    fromPosition: Vector3;
    toPosition: Vector3;
    elapsed: number;
  } | null>(null);
  const actionStateRef = useRef<{
    phase: 'rotating' | 'waiting' | 'playing';
    fromRotation: number;
    rotationDelta: number;
    elapsed: number;
    clipDuration: number;
    clipName: 'attack' | 'hurt';
    damage?: number;
  } | null>(null);
  const prevPositionRef = useRef(position);
  const [damageDisplay, setDamageDisplay] = useState<{
    key: number;
    damage: number;
    origin: [number, number, number];
  } | null>(null);

  useEffect(() => {
    groupRef.current.position.set(position[0], position[1], position[2]);
    groupRef.current.rotation.y = (rotationY * Math.PI) / 180;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  useEffect(() => {
    const mixer = new AnimationMixer(scene);
    const idleClip = gltf.animations.find((clip: AnimationClip) => clip.name === 'Idle');
    const runClip = gltf.animations.find((clip: AnimationClip) => clip.name === 'Run');
    const attackClip = gltf.animations.find((clip: AnimationClip) => clip.name === 'Attack');
    const hurtClip = gltf.animations.find((clip: AnimationClip) => clip.name === 'Hurt');
    const idleAction = idleClip ? mixer.clipAction(idleClip) : undefined;
    const runAction = runClip ? mixer.clipAction(runClip) : undefined;
    const attackAction = attackClip ? mixer.clipAction(attackClip) : undefined;
    const hurtAction = hurtClip ? mixer.clipAction(hurtClip) : undefined;
    if (attackAction) {
      attackAction.setLoop(LoopOnce, 1);
      attackAction.clampWhenFinished = true;
    }
    if (hurtAction) {
      hurtAction.setLoop(LoopOnce, 1);
      hurtAction.clampWhenFinished = true;
    }
    actionsRef.current = { idle: idleAction, run: runAction, attack: attackAction, hurt: hurtAction };
    idleAction?.play();
    mixerRef.current = mixer;
    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [scene, gltf.animations]);

  useEffect(() => {
    const [prevX, prevY, prevZ] = prevPositionRef.current;
    prevPositionRef.current = position;
    const [nextX, , nextZ] = position;
    if (prevX === nextX && prevZ === nextZ) return;

    const targetRotation = Math.atan2(nextX - prevX, nextZ - prevZ);
    moveRef.current = {
      phase: 'rotating',
      fromRotation: groupRef.current.rotation.y,
      rotationDelta: normalizeAngle(targetRotation - groupRef.current.rotation.y),
      fromPosition: new Vector3(prevX, prevY, prevZ),
      toPosition: new Vector3(nextX, prevY, nextZ),
      elapsed: 0,
    };
  }, [position]);

  useEffect(() => {
    if (!action) return;
    const { attack, hurt } = actionsRef.current;

    if (action.type === 'attack') {
      const targetRotation = Math.atan2(
        action.targetX - groupRef.current.position.x,
        action.targetZ - groupRef.current.position.z
      );
      actionStateRef.current = {
        phase: 'rotating',
        fromRotation: groupRef.current.rotation.y,
        rotationDelta: normalizeAngle(targetRotation - groupRef.current.rotation.y),
        elapsed: 0,
        clipDuration: attack?.getClip().duration ?? 0.6,
        clipName: 'attack',
      };
      return;
    }

    actionStateRef.current = {
      phase: 'waiting',
      fromRotation: groupRef.current.rotation.y,
      rotationDelta: 0,
      elapsed: 0,
      clipDuration: hurt?.getClip().duration ?? 0.6,
      clipName: 'hurt',
      damage: action.damage,
    };
  }, [action]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);

    const move = moveRef.current;
    if (move) {
      move.elapsed += delta;

      if (move.phase === 'rotating') {
        const t = Math.min(move.elapsed / ROTATE_DURATION, 1);
        groupRef.current.rotation.y = move.fromRotation + move.rotationDelta * t;
        if (t >= 1) {
          move.phase = 'moving';
          move.elapsed = 0;
          const { idle, run } = actionsRef.current;
          if (run) {
            idle?.fadeOut(0.1);
            run.reset().fadeIn(0.1).play();
          }
        }
      } else {
        const t = Math.min(move.elapsed / MOVE_DURATION, 1);
        groupRef.current.position.lerpVectors(move.fromPosition, move.toPosition, t);
        if (t >= 1) {
          moveRef.current = null;
          const { idle, run } = actionsRef.current;
          run?.fadeOut(0.2);
          idle?.reset().fadeIn(0.2).play();
        }
      }
    }

    const activeAction = actionStateRef.current;
    if (activeAction) {
      activeAction.elapsed += delta;

      if (activeAction.phase === 'rotating') {
        const t = Math.min(activeAction.elapsed / ROTATE_DURATION, 1);
        groupRef.current.rotation.y = activeAction.fromRotation + activeAction.rotationDelta * t;
        if (t >= 1) {
          activeAction.phase = 'playing';
          activeAction.elapsed = 0;
          const { idle, attack } = actionsRef.current;
          idle?.fadeOut(0.1);
          attack?.reset().fadeIn(0.1).play();
        }
      } else if (activeAction.phase === 'waiting') {
        if (activeAction.elapsed >= HURT_DELAY) {
          activeAction.phase = 'playing';
          activeAction.elapsed = 0;
          const { idle, hurt } = actionsRef.current;
          idle?.fadeOut(0.1);
          hurt?.reset().fadeIn(0.1).play();
          if (activeAction.damage !== undefined) {
            const { x, y, z } = groupRef.current.position;
            setDamageDisplay({ key: Date.now(), damage: activeAction.damage, origin: [x, y + 1, z] });
          }
        }
      } else {
        const t = Math.min(activeAction.elapsed / activeAction.clipDuration, 1);
        if (t >= 1) {
          actionStateRef.current = null;
          const { idle, attack, hurt } = actionsRef.current;
          (activeAction.clipName === 'attack' ? attack : hurt)?.fadeOut(0.2);
          idle?.reset().fadeIn(0.2).play();
        }
      }
    }
  });

  return (
    <>
      <primitive ref={groupRef} object={scene} scale={0.4} />
      {damageDisplay && (
        <DamageNumber
          key={damageDisplay.key}
          damage={damageDisplay.damage}
          origin={damageDisplay.origin}
          onComplete={() => setDamageDisplay(null)}
        />
      )}
    </>
  );
};

const Avatars = ({
  team,
  tiles,
  attackEvent,
}: {
  team: TeamMember[];
  tiles: typeof initialMapTilesData;
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

interface MapTilesProps {
  tiles: typeof initialMapTilesData;
  onTileClick: (id: number) => void;
  dimmedTileIds: Set<number>;
}

const MapTiles = ({ tiles, onTileClick, dimmedTileIds }: MapTilesProps) => {
  return (
    <>
      {tiles.map(({ id, positionX, positionZ, rotationY, tileName }) => (
        <Tile
          key={id}
          position={[positionX, 0, positionZ]}
          rotation={[0, (rotationY * Math.PI) / 180, 0]}
          name={tileName}
          onClick={() => onTileClick(id)}
          dimmed={dimmedTileIds.has(id)}
        />
      ))}
    </>
  );
};

const NEIGHBOR_DISTANCE_THRESHOLD = 1.1;
const IMPASSABLE_TILE_NAME_PARTS = ['hill', 'mountain'];

const isNeighborTile = (
  tile: { positionX: number; positionZ: number },
  origin: { positionX: number; positionZ: number }
) => {
  const dx = tile.positionX - origin.positionX;
  const dz = tile.positionZ - origin.positionZ;
  return Math.sqrt(dx * dx + dz * dz) <= NEIGHBOR_DISTANCE_THRESHOLD;
};

interface MapProps {
  selectedTileName: string | null;
  team: TeamMember[];
  enemyTeam: TeamMember[];
  activeAvatarId: number | null;
  isMoveMode: boolean;
  isAttackMode: boolean;
  onMoveAvatarToTile: (tileId: number) => void;
  onAttackTile: (attackerId: number, targetId: number) => void;
}

export const DuelMap = ({
  selectedTileName,
  team,
  enemyTeam,
  activeAvatarId,
  isMoveMode,
  isAttackMode,
  onMoveAvatarToTile,
  onAttackTile,
}: MapProps) => {
  const [tiles, setTiles] = useState(initialMapTilesData);
  const [attackEvent, setAttackEvent] = useState<{
    attackerId: number;
    targetId: number;
    targetX: number;
    targetZ: number;
    damage: number;
  } | null>(null);

  const allAvatars = useMemo(() => [...team, ...enemyTeam], [team, enemyTeam]);

  const activeTile = useMemo(() => {
    const activeAvatar = team.find(({ id }) => id === activeAvatarId);
    if (!activeAvatar) return null;
    return tiles.find((tile) => tile.id === activeAvatar.tileID) ?? null;
  }, [tiles, team, activeAvatarId]);

  const dimmedTileIds = useMemo(() => {
    if (!activeTile) return new Set<number>();

    if (isMoveMode) {
      const occupiedTileIds = new Set(
        allAvatars.filter(({ id }) => id !== activeAvatarId).map(({ tileID }) => tileID)
      );
      const ids = tiles
        .filter((tile) => {
          if (tile.id === activeTile.id) return false;
          if (occupiedTileIds.has(tile.id)) return true;
          if (IMPASSABLE_TILE_NAME_PARTS.some((part) => tile.tileName.includes(part))) return true;
          return !isNeighborTile(tile, activeTile);
        })
        .map((tile) => tile.id);
      return new Set(ids);
    }

    if (isAttackMode) {
      const enemyTileIds = new Set(enemyTeam.map(({ tileID }) => tileID));
      const ids = tiles
        .filter((tile) => {
          if (tile.id === activeTile.id) return false;
          return !(enemyTileIds.has(tile.id) && isNeighborTile(tile, activeTile));
        })
        .map((tile) => tile.id);
      return new Set(ids);
    }

    return new Set<number>();
  }, [tiles, isMoveMode, isAttackMode, activeTile, allAvatars, activeAvatarId, enemyTeam]);

  const handleTileClick = (id: number) => {
    if (!activeTile || id === activeTile.id || dimmedTileIds.has(id)) return;

    if (isMoveMode) {
      onMoveAvatarToTile(id);
      return;
    }

    if (isAttackMode && activeAvatarId !== null) {
      const targetTile = tiles.find((tile) => tile.id === id);
      const targetAvatar = enemyTeam.find(({ tileID }) => tileID === id);
      const attackerAvatar = allAvatars.find(({ id }) => id === activeAvatarId);
      if (!targetTile || !targetAvatar || !attackerAvatar) return;
      setAttackEvent({
        attackerId: activeAvatarId,
        targetId: targetAvatar.id,
        targetX: targetTile.positionX,
        targetZ: targetTile.positionZ,
        damage: attackerAvatar.attack - targetAvatar.defence,
      });
      onAttackTile(activeAvatarId, targetAvatar.id);
    }
  };

  return (
    <Canvas camera={{ position: [0, 12, 0.01], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <MapTiles tiles={tiles} onTileClick={handleTileClick} dimmedTileIds={dimmedTileIds} />
      <Avatars team={allAvatars} tiles={tiles} attackEvent={attackEvent} />
      <CameraControls />
    </Canvas>
  );
};
