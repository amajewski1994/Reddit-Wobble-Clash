import { ThreeEvent, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Mesh, TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MapCanvas } from '../shared/MapCanvas';
import { MapTiles } from '../shared/MapTiles';
import { Avatar } from '../shared/Avatar';
import { AVATAR_Y_OFFSET } from '../shared/Avatars';
import { ROTATE_LEFT_ICON } from '../shared/tileAssets';
import { IMPASSABLE_TILE_NAME_PARTS } from '../../data/consts';
import { characters } from '../../data/characters';
import type { MapTileData } from '../../../shared/types/mapTile';
import type { CreateMapProps } from '../../../shared/types/createMap';

const ROTATE_STEP = 60;
const ROTATE_ARROW_OFFSET = 0.6;
const ROTATE_ARROW_HEIGHT = 0.1;
const MAX_AVATAR_TILE_ID = 74;

const getAvatarVariant = (avatarName: string) =>
  characters.find((character) => character.name === avatarName)?.objectName[0];

const isImpassableTileName = (tileName: string) =>
  IMPASSABLE_TILE_NAME_PARTS.some((part) => tileName.includes(part));

const RotateArrow = ({
  direction,
  position,
  iconUrl,
  onClick,
}: {
  direction: 'RIGHT' | 'LEFT';
  position: [number, number, number];
  iconUrl: string;
  onClick: () => void;
}) => {
  const texture = useLoader(TextureLoader, iconUrl);
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const originalRaycast = mesh.raycast.bind(mesh);
    // Rotate arrows sit low above the ground and can overlap a neighboring
    // tile's raised terrain (hills/mountains). Force any real intersection
    // with this plane to report distance 0 so it always sorts ahead of
    // whatever tile geometry happens to be underneath it.
    mesh.raycast = (raycaster, intersects) => {
      const before = intersects.length;
      originalRaycast(raycaster, intersects);
      for (let i = before; i < intersects.length; i++) {
        intersects[i]!.distance = 0;
      }
    };
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, direction === 'RIGHT' ? -0.5 : 0.5]}
      scale={[direction === 'RIGHT' ? -1 : 1, 1, 1]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onClick();
      }}
      renderOrder={999}
    >
      <planeGeometry args={[0.5, 0.5]} />
      <meshBasicMaterial map={texture} transparent depthTest={false} side={2} />
    </mesh>
  );
};

const RotateControls = ({
  tile,
  onRotate,
}: {
  tile: MapTileData;
  onRotate: (id: number, delta: number) => void;
}) => {
  return (
    <>
      <RotateArrow
        direction="RIGHT"
        position={[tile.positionX - ROTATE_ARROW_OFFSET, ROTATE_ARROW_HEIGHT, tile.positionZ]}
        iconUrl={ROTATE_LEFT_ICON}
        onClick={() => onRotate(tile.id, -ROTATE_STEP)}
      />
      <RotateArrow
        direction="LEFT"
        position={[tile.positionX + ROTATE_ARROW_OFFSET, ROTATE_ARROW_HEIGHT, tile.positionZ]}
        iconUrl={ROTATE_LEFT_ICON}
        onClick={() => onRotate(tile.id, ROTATE_STEP)}
      />
    </>
  );
};

export const CreateMap = ({
  tiles,
  selectedTileName,
  onChangeTileName,
  selectedAvatarName,
  placedAvatars,
  activeSlotIndex,
  onPlaceAvatar,
  rotatingTileId,
  onRotatingTileIdChange,
  onRotateTile,
}: CreateMapProps) => {
  // Preloading here (during CreateMap's first render) rather than at module
  // scope means it happens after useAssetsLoading has already subscribed
  // to the loading manager, so isAssetsLoading actually picks it up and
  // shows the spinner — a module-level preload fires before that
  // subscription exists and gets missed.
  useMemo(() => {
    characters.forEach((character) => {
      const variant = character.objectName[0];
      if (variant) useLoader.preload(GLTFLoader, `/assets/characters/${variant.name}.glb`);
    });
  }, []);

  const handleTileClick = (id: number) => {
    if (selectedAvatarName && activeSlotIndex !== null) {
      if (id > MAX_AVATAR_TILE_ID) return;
      const targetTile = tiles.find((tile) => tile.id === id);
      if (!targetTile || isImpassableTileName(targetTile.tileName)) return;
      onPlaceAvatar(id);
      return;
    }
    if (selectedTileName) {
      const isOccupied = placedAvatars.some((slot) => slot?.tileID === id);
      if (isImpassableTileName(selectedTileName) && isOccupied) return;
      onChangeTileName(id, selectedTileName);
      return;
    }
    onRotatingTileIdChange(rotatingTileId === id ? null : id);
  };

  const rotatingTile = tiles.find((tile) => tile.id === rotatingTileId) ?? null;

  return (
    <MapCanvas backgroundUrl="/assets/images/duel%20-%20background.png">
      <MapTiles tiles={tiles} onTileClick={handleTileClick} />
      {rotatingTile && <RotateControls tile={rotatingTile} onRotate={onRotateTile} />}
      {placedAvatars.map((slot, index) => {
        if (!slot) return null;
        const tile = tiles.find((tile) => tile.id === slot.tileID);
        if (!tile) return null;
        const variant = getAvatarVariant(slot.avatarName);
        if (!variant) return null;
        return (
          <Avatar
            key={index}
            name={slot.avatarName}
            objectName={variant.name}
            scale={variant.scale}
            position={[tile.positionX, AVATAR_Y_OFFSET, tile.positionZ]}
            rotationY={tile.rotationY}
            action={null}
            animateMovement={false}
          />
        );
      })}
    </MapCanvas>
  );
};
