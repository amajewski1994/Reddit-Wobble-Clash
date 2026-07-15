import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Avatar } from '../shared/Avatar';
import { AVATAR_Y_OFFSET } from '../shared/Avatars';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useImagePreload } from '../../hooks/useImagePreload';
import { characters } from '../../data/characters';
import type { PickModeCanvasProps } from '../../../shared/types/pickMode';
import type { AvatarAction } from '../../../shared/types/duelMap';

const PICK_CAMERA_POSITION: [number, number, number] = [0, 0.9, 2.4];
const PICK_CAMERA_TARGET: [number, number, number] = [0, 0.6, 0];
const AVATAR_FACING_CAMERA_ROTATION_Y = 0;
const PEDESTAL_Y = -0.02;
const VICTORY_ANIMATION_CLIP = 'Victory';
const BACKGROUND_IMAGE_SRC = '/assets/images/WC%20-%20background.png';

characters.forEach((character) => {
  const baseVariant = character.objectName[0];
  if (!baseVariant) return;
  useLoader.preload(GLTFLoader, `/assets/characters/${baseVariant.name}.glb`);
});

const CameraLookAt = ({ target }: { target: [number, number, number] }) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);

  return null;
};

const PreviewAvatar = ({
  name,
  objectName,
  victoryToken,
  scale,
}: {
  name: string;
  objectName: string;
  victoryToken: number;
  scale: number;
}) => {
  const [action, setAction] = useState<AvatarAction | null>(null);
  const previousVictoryTokenRef = useRef(victoryToken);

  useEffect(() => {
    if (victoryToken === previousVictoryTokenRef.current) return;
    previousVictoryTokenRef.current = victoryToken;
    setAction({
      type: 'ability',
      playAnimation: true,
      animationClip: VICTORY_ANIMATION_CLIP,
      label: null,
    });
  }, [victoryToken]);

  return (
    <Avatar
      name={name}
      objectName={objectName}
      position={[0, AVATAR_Y_OFFSET, 0]}
      rotationY={AVATAR_FACING_CAMERA_ROTATION_Y}
      action={action}
      animateMovement={false}
      scale={scale}
    />
  );
};

export const PickModeCanvas = ({ character, victoryToken }: PickModeCanvasProps) => {
  const objectVariant = character.objectName[0];
  const isBackgroundLoaded = useImagePreload(BACKGROUND_IMAGE_SRC);

  return (
    <>
      <LoadingSpinner visible={!isBackgroundLoaded} />
      <Canvas
        camera={{ position: PICK_CAMERA_POSITION, fov: 40 }}
        gl={{ alpha: true }}
        style={{
          backgroundImage: `url("${BACKGROUND_IMAGE_SRC}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[3, 5, 3]} intensity={1.2} />
        <CameraLookAt target={PICK_CAMERA_TARGET} />
        <mesh position={[0, PEDESTAL_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 32]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        {objectVariant && (
          <PreviewAvatar
            key={character.id}
            name={character.name}
            objectName={objectVariant.name}
            victoryToken={victoryToken}
            scale={objectVariant.scale}
          />
        )}
      </Canvas>
    </>
  );
};
