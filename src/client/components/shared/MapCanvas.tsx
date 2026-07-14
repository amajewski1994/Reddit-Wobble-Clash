import { Canvas } from '@react-three/fiber';
import { ReactNode } from 'react';
import { CameraControls } from './CameraControls';

export const MapCanvas = ({ children }: { children: ReactNode }) => {
  return (
    <Canvas camera={{ position: [0, 10.39, 6], fov: 50 }}>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      {children}
      <CameraControls />
    </Canvas>
  );
};
