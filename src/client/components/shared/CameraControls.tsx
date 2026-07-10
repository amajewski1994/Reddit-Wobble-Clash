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

export const CameraControls = () => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls>(null);

  useEffect(() => {
    controlsRef.current?.update();
  }, []);

  return (
    <orbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableDamping
      enableRotate={false}
      enableZoom={false}
      screenSpacePanning={false}
      mouseButtons={{ LEFT: MOUSE.PAN, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }}
      touches={{ ONE: TOUCH.PAN, TWO: TOUCH.PAN }}
    />
  );
};
