import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TILE_NAMES } from '../tileNames';

export const TILE_PATHS = TILE_NAMES.map((name) => `/assets/tiles/${name}.glb`);
export const ROTATE_LEFT_ICON = '/assets/images/curve-up-arrow.png';
export const ROTATE_RIGHT_ICON = '/assets/images/curve-down-arrow.png';

TILE_PATHS.forEach((path) => useLoader.preload(GLTFLoader, path));
useLoader.preload(TextureLoader, ROTATE_LEFT_ICON);
useLoader.preload(TextureLoader, ROTATE_RIGHT_ICON);
