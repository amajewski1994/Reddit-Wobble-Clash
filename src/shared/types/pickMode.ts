import type { Character } from './characters';

export interface PickModeUIProps {
  characters: Character[];
  selectedCharacterIds: number[];
  onToggleCharacter: (id: number) => void;
  onPick: (id: number) => void;
  previewCharacterId: number;
  onPreviewCharacter: (id: number) => void;
  onConfirm: () => void;
  onBack: () => void;
  maxTeamSize: number;
}

export interface PickModeCanvasProps {
  character: Character;
  victoryToken: number;
}
