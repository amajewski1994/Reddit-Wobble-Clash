import type {
  LoadCurrentMapErrorResponse,
  LoadCurrentMapResponse,
  MapStats,
  PublishedMap,
} from '../../shared/types/savedMap';

export async function loadCurrentMap(): Promise<
  { map: PublishedMap; stats: MapStats } | null
> {
  const response = await fetch('/api/maps/current');

  // Aktualny post nie ma przypisanej mapy.
  // To oznacza zwykły tryb aplikacji.
  if (response.status === 404) {
    return null;
  }

  let result: LoadCurrentMapResponse | LoadCurrentMapErrorResponse;

  try {
    result = await response.json();
  } catch {
    throw new Error('Serwer zwrócił nieprawidłową odpowiedź.');
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.success ? 'Nie udało się pobrać mapy.' : result.error
    );
  }

  return { map: result.map, stats: result.stats };
}
