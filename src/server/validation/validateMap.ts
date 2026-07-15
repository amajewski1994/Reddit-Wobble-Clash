import type { SaveMapRequest, SavedMapTile } from '../../shared/types/savedMap';

import type { PlacedAvatar } from '../../shared/types/createMap';

const MAX_TITLE_LENGTH = 20;
const EXPECTED_TILE_COUNT = 105;
const MAX_ENEMY_COUNT = 4;

const ALLOWED_ROTATIONS = new Set([0, 60, 120, 180, 240, 300]);

export class MapValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MapValidationError';
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validateTile = (value: unknown): asserts value is SavedMapTile => {
  if (!isObject(value)) {
    throw new MapValidationError('Nieprawidłowe dane pola mapy.');
  }

  if (
    typeof value.id !== 'number' ||
    !Number.isInteger(value.id) ||
    value.id < 0 ||
    value.id >= EXPECTED_TILE_COUNT
  ) {
    throw new MapValidationError('Nieprawidłowe ID pola mapy.');
  }

  if (
    typeof value.tileName !== 'string' ||
    value.tileName.length < 1 ||
    value.tileName.length > 50
  ) {
    throw new MapValidationError(
      `Nieprawidłowy tileName dla pola ${value.id}.`
    );
  }

  if (
    typeof value.rotationY !== 'number' ||
    !ALLOWED_ROTATIONS.has(value.rotationY)
  ) {
    throw new MapValidationError(`Nieprawidłowy obrót pola ${value.id}.`);
  }
};

const validateEnemy = (value: unknown): asserts value is PlacedAvatar => {
  if (!isObject(value)) {
    throw new MapValidationError('Nieprawidłowe dane przeciwnika.');
  }

  if (
    typeof value.tileID !== 'number' ||
    !Number.isInteger(value.tileID) ||
    value.tileID < 0 ||
    value.tileID >= EXPECTED_TILE_COUNT
  ) {
    throw new MapValidationError('Nieprawidłowe pole przeciwnika.');
  }

  if (
    typeof value.avatarName !== 'string' ||
    value.avatarName.length < 1 ||
    value.avatarName.length > 100
  ) {
    throw new MapValidationError('Nieprawidłowa nazwa przeciwnika.');
  }
};

export function validateSaveMapRequest(
  value: unknown
): asserts value is SaveMapRequest {
  if (!isObject(value)) {
    throw new MapValidationError('Nieprawidłowe dane mapy.');
  }

  if (
    typeof value.title !== 'string' ||
    value.title.trim().length < 1 ||
    value.title.trim().length > MAX_TITLE_LENGTH
  ) {
    throw new MapValidationError(
      `Tytuł mapy musi mieć od 1 do ${MAX_TITLE_LENGTH} znaków.`
    );
  }

  if (
    typeof value.rating !== 'number' ||
    !Number.isFinite(value.rating) ||
    value.rating < 0 ||
    value.rating > 5
  ) {
    throw new MapValidationError('Nieprawidłowy rating mapy.');
  }

  if (
    !Array.isArray(value.tiles) ||
    value.tiles.length !== EXPECTED_TILE_COUNT
  ) {
    throw new MapValidationError(
      `Mapa musi zawierać dokładnie ${EXPECTED_TILE_COUNT} pól.`
    );
  }

  if (
    !Array.isArray(value.enemies) ||
    value.enemies.length < 1 ||
    value.enemies.length > MAX_ENEMY_COUNT
  ) {
    throw new MapValidationError(
      `Mapa musi zawierać od 1 do ${MAX_ENEMY_COUNT} przeciwników.`
    );
  }

  value.tiles.forEach(validateTile);
  value.enemies.forEach(validateEnemy);

  const tileIds = new Set<number>();

  for (const tile of value.tiles) {
    if (tileIds.has(tile.id)) {
      throw new MapValidationError(`Pole ${tile.id} występuje kilka razy.`);
    }

    tileIds.add(tile.id);
  }

  for (let id = 0; id < EXPECTED_TILE_COUNT; id++) {
    if (!tileIds.has(id)) {
      throw new MapValidationError(`Brakuje pola mapy o ID ${id}.`);
    }
  }

  const occupiedEnemyTiles = new Set<number>();

  for (const enemy of value.enemies) {
    if (occupiedEnemyTiles.has(enemy.tileID)) {
      throw new MapValidationError(
        `Kilku przeciwników znajduje się na polu ${enemy.tileID}.`
      );
    }

    occupiedEnemyTiles.add(enemy.tileID);
  }
}
