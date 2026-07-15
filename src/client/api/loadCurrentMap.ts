import type { PublishedMap } from '../../shared/types/savedMap';

type LoadCurrentMapSuccessResponse = {
  success: true;
  map: PublishedMap;
};

type LoadCurrentMapErrorResponse = {
  success: false;
  error: string;
};

export async function loadCurrentMap(): Promise<PublishedMap | null> {
  const response = await fetch('/api/maps/current');

  // Aktualny post nie ma przypisanej mapy.
  // To oznacza zwykły tryb aplikacji.
  if (response.status === 404) {
    return null;
  }

  let result: LoadCurrentMapSuccessResponse | LoadCurrentMapErrorResponse;

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

  return result.map;
}
