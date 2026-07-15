import type {
  PublishMapErrorResponse,
  PublishMapResponse,
  SaveMapRequest,
} from '../../shared/types/savedMap';

export async function publishMap(
  map: SaveMapRequest
): Promise<PublishMapResponse> {
  const response = await fetch('/api/maps/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(map),
  });

  const result = (await response.json()) as
    | PublishMapResponse
    | PublishMapErrorResponse;

  if (!response.ok || !result.success) {
    throw new Error(
      result.success ? 'Nie udało się opublikować mapy.' : result.error
    );
  }

  return result;
}
