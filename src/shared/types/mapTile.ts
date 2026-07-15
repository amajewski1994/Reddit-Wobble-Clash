export interface MapTileData {
  id: number;
  positionX: number;
  positionZ: number;
  rotationY: number;
  tileName: string;
}

export interface DuelMapTileData extends MapTileData {
  blocked: boolean;
}
