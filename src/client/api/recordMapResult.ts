import type {
  MapStats,
  MapStatsErrorResponse,
  MapStatsResponse,
} from '../../shared/types/savedMap';

export async function recordMapResult(
  result: 'win' | 'lost'
): Promise<MapStats | null> {
  try {
    const response = await fetch('/api/maps/current/result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ result }),
    });

    const data = (await response.json()) as
      | MapStatsResponse
      | MapStatsErrorResponse;

    if (!response.ok || !data.success) {
      return null;
    }

    return data.stats;
  } catch {
    return null;
  }
}
