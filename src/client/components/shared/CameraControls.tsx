import { extend, ThreeElement, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
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

  return <orbitControls ref={controlsRef} args={[camera, gl.domElement]} enableDamping />;
};
