import { Canvas } from '@react-three/fiber';
import { ReactNode } from 'react';
import { CameraControls } from './CameraControls';

export const MapCanvas = ({ children }: { children: ReactNode }) => {
  return (
    <Canvas camera={{ position: [0, 12, 0.01], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      {children}
      <CameraControls />
    </Canvas>
  );
};
