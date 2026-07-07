import { useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  CanvasTexture,
  LoopOnce,
  Object3D,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinnedScene } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { AvatarAction } from '../../types/duelMap';

const ROTATE_DURATION = 0.3;
const MOVE_DURATION = 0.8;
const HURT_DELAY = 1;
const DAMAGE_NUMBER_DURATION = 1;
const DAMAGE_NUMBER_RISE = 0.8;

const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

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

export const Avatar = ({
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
    death: AnimationAction | undefined;
  }>({
    idle: undefined,
    run: undefined,
    attack: undefined,
    hurt: undefined,
    death: undefined,
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
    clipName: 'attack' | 'hurt' | 'death';
    damage?: number;
  } | null>(null);
  const isDeadRef = useRef(false);
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
    const deathClip = gltf.animations.find((clip: AnimationClip) => clip.name === 'Death');
    const idleAction = idleClip ? mixer.clipAction(idleClip) : undefined;
    const runAction = runClip ? mixer.clipAction(runClip) : undefined;
    const attackAction = attackClip ? mixer.clipAction(attackClip) : undefined;
    const hurtAction = hurtClip ? mixer.clipAction(hurtClip) : undefined;
    const deathAction = deathClip ? mixer.clipAction(deathClip) : undefined;
    if (attackAction) {
      attackAction.setLoop(LoopOnce, 1);
      attackAction.clampWhenFinished = true;
    }
    if (hurtAction) {
      hurtAction.setLoop(LoopOnce, 1);
      hurtAction.clampWhenFinished = true;
    }
    if (deathAction) {
      deathAction.setLoop(LoopOnce, 1);
      deathAction.clampWhenFinished = true;
    }
    actionsRef.current = {
      idle: idleAction,
      run: runAction,
      attack: attackAction,
      hurt: hurtAction,
      death: deathAction,
    };
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
    if (!action || isDeadRef.current) return;
    const { attack, hurt, death } = actionsRef.current;

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

    if (action.isDead) isDeadRef.current = true;

    actionStateRef.current = {
      phase: 'waiting',
      fromRotation: groupRef.current.rotation.y,
      rotationDelta: 0,
      elapsed: 0,
      clipDuration: (action.isDead ? death : hurt)?.getClip().duration ?? 0.6,
      clipName: action.isDead ? 'death' : 'hurt',
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
          const { idle, hurt, death } = actionsRef.current;
          const hitAction = activeAction.clipName === 'death' ? death : hurt;
          idle?.fadeOut(0.1);
          hitAction?.reset().fadeIn(0.1).play();
          if (activeAction.damage !== undefined) {
            const { x, y, z } = groupRef.current.position;
            setDamageDisplay({ key: Date.now(), damage: activeAction.damage, origin: [x, y + 1, z] });
          }
        }
      } else {
        const t = Math.min(activeAction.elapsed / activeAction.clipDuration, 1);
        if (t >= 1 && activeAction.clipName !== 'death') {
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
