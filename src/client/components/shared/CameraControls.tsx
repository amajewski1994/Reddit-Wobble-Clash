import { extend, ThreeElement, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MOUSE, TOUCH } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

extend({ OrbitControls });

declare module '@react-three/fiber' {
  interface ThreeElements {
    orbitControls: ThreeElement<typeof OrbitControls>;
  }
}

type CameraControlsProps = {
  minX?: number;
  maxX?: number;
  minZ?: number;
  maxZ?: number;
  minDistance?: number;
  maxDistance?: number;
};

export const CameraControls = ({
  minX = -6,
  maxX = 6,
  minZ = -6,
  maxZ = 6,
  minDistance = 6,
  maxDistance = 20,
}: CameraControlsProps = {}) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.update();

    const clampPan = () => {
      const clampedX = Math.min(Math.max(controls.target.x, minX), maxX);
      const clampedZ = Math.min(Math.max(controls.target.z, minZ), maxZ);

      const deltaX = clampedX - controls.target.x;
      const deltaZ = clampedZ - controls.target.z;

      if (deltaX !== 0 || deltaZ !== 0) {
        controls.target.x = clampedX;
        controls.target.z = clampedZ;
        camera.position.x += deltaX;
        camera.position.z += deltaZ;
      }
    };

    controls.addEventListener('change', clampPan);
    return () => controls.removeEventListener('change', clampPan);
  }, [camera, minX, maxX, minZ, maxZ]);

  return (
    <orbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableDamping
      enableRotate={false}
      enableZoom
      minDistance={minDistance}
      maxDistance={maxDistance}
      screenSpacePanning={false}
      mouseButtons={{ LEFT: MOUSE.PAN, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }}
      touches={{ ONE: TOUCH.PAN, TWO: TOUCH.PAN }}
    />
  );
};
