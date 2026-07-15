import { useLoader } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Material, Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const Tile = ({
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
          material.opacity = dimmed ? 0.3 : 1;
          material.needsUpdate = true;
        });
      }
    });
  }, [scene, dimmed]);

  return <primitive object={scene} position={position} rotation={rotation} onClick={onClick} />;
};
