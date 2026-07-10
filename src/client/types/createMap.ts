import type { MapTileData } from './mapTile';

export interface PlacedAvatar {
  tileID: number;
  avatarName: string;
}

export interface CreateMapUIProps {
  selectedTileName: string | null;
  onSelectTileName: (tileName: string | null) => void;
  selectedAvatarName: string | null;
  onSelectAvatarName: (avatarName: string | null) => void;
  placedAvatars: (PlacedAvatar | null)[];
  activeSlotIndex: number | null;
  onSelectSlot: (index: number | null) => void;
  onRemoveAvatar: (index: number) => void;
  mapTitle: string;
  onChangeMapTitle: (title: string) => void;
  mapRating: number;
  onResetRotation: () => void;
}

export interface CreateMapProps {
  tiles: MapTileData[];
  selectedTileName: string | null;
  onChangeTileName: (id: number, tileName: string) => void;
  selectedAvatarName: string | null;
  placedAvatars: (PlacedAvatar | null)[];
  activeSlotIndex: number | null;
  onPlaceAvatar: (tileID: number) => void;
  rotatingTileId: number | null;
  onRotatingTileIdChange: (id: number | null) => void;
  onRotateTile: (id: number, delta: number) => void;
}
