const NEIGHBOR_DISTANCE_THRESHOLD = 1.1;

export const isNeighborTile = (
  tile: { positionX: number; positionZ: number },
  origin: { positionX: number; positionZ: number }
) => {
  const dx = tile.positionX - origin.positionX;
  const dz = tile.positionZ - origin.positionZ;
  return Math.sqrt(dx * dx + dz * dz) <= NEIGHBOR_DISTANCE_THRESHOLD;
};
