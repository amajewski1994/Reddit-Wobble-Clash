import type { PlacedAvatar } from './createMap';

export interface SavedMapTile {
  id: number;
  tileName: string;
  rotationY: number;
}

export interface SaveMapRequest {
  title: string;
  rating: number;
  tiles: SavedMapTile[];
  enemies: PlacedAvatar[];
}

export interface PublishedMap extends SaveMapRequest {
  postId: string;
  authorId: string;
  createdAt: number;
  version: 1;
}

export interface PublishMapResponse {
  success: true;
  postId: string;
  postUrl?: string;
}

export interface PublishMapErrorResponse {
  success: false;
  error: string;
}

export interface LoadCurrentMapResponse {
  success: true;
  map: PublishedMap;
}

export interface LoadCurrentMapErrorResponse {
  success: false;
  error: string;
}
