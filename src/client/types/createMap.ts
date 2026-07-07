export interface MapUIProps {
  selectedTileName: string | null;
  onSelectTileName: (tileName: string | null) => void;
  onResetRotation: () => void;
}

export interface CreateMapProps {
  selectedTileName: string | null;
  rotatingTileId: number | null;
  onRotatingTileIdChange: (id: number | null) => void;
}
