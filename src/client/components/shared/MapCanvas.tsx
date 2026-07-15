import { Canvas, useLoader } from '@react-three/fiber';
import { ReactNode, useEffect } from 'react';
import { RepeatWrapping, TextureLoader } from 'three';
import { CameraControls } from './CameraControls';

const DEFAULT_BACKGROUND_TEXTURE_URL = '/assets/splash%20-%20background.png';

// A flat plane in world space (rather than scene.background, which is
// screen-locked and ignores camera movement) so panning with
// CameraControls actually shifts what's visible, instead of leaving the
// backdrop frozen in place. Sized well beyond the camera's pan/zoom range
// with a repeating texture so no bare edge is ever visible.
const BACKGROUND_PLANE_SIZE = 200;
const BACKGROUND_TEXTURE_REPEAT = 4;
const BACKGROUND_DARKEN_COLOR = '#cccccc';

const SceneBackground = ({ backgroundUrl }: { backgroundUrl: string }) => {
  const texture = useLoader(TextureLoader, backgroundUrl);

  useEffect(() => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;

    // The plane is square, but the source image usually isn't — repeating
    // it 1:1 on both axes would squash it to fit each square tile. Crop
    // each tile to the image's real aspect ratio instead (same idea as
    // CSS `background-size: cover`) so it repeats undistorted.
    const imageAspect = texture.image.naturalWidth / texture.image.naturalHeight;
    const repeatX =
      imageAspect > 1
        ? BACKGROUND_TEXTURE_REPEAT / imageAspect
        : BACKGROUND_TEXTURE_REPEAT;
    const repeatY =
      imageAspect > 1
        ? BACKGROUND_TEXTURE_REPEAT
        : BACKGROUND_TEXTURE_REPEAT * imageAspect;

    texture.repeat.set(repeatX, repeatY);

    // Center the image on the plane's origin (where the camera starts and
    // pans around) instead of anchoring it to the texture's raw (0, 0)
    // corner. Without this, a repeat/tile seam can land in the middle of
    // the viewport, making the image look cut in half.
    texture.offset.set(0.5 - repeatX / 2, 0.5 - repeatY / 2);
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[BACKGROUND_PLANE_SIZE, BACKGROUND_PLANE_SIZE]} />
      <meshBasicMaterial map={texture} color={BACKGROUND_DARKEN_COLOR} />
    </mesh>
  );
};

export const MapCanvas = ({
  children,
  backgroundUrl = DEFAULT_BACKGROUND_TEXTURE_URL,
}: {
  children: ReactNode;
  backgroundUrl?: string;
}) => {
  return (
    <Canvas camera={{ position: [0, 10.39, 6], fov: 50 }}>
      <SceneBackground backgroundUrl={backgroundUrl} />
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      {children}
      <CameraControls />
    </Canvas>
  );
};
