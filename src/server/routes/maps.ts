import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type {
  LoadCurrentMapErrorResponse,
  LoadCurrentMapResponse,
  PublishMapErrorResponse,
  PublishMapResponse,
} from '../../shared/types/savedMap';

import {
  MapValidationError,
  validateSaveMapRequest,
} from '../validation/validateMap';

import { MapService, MapServiceError } from '../services/mapService';

export const mapsRouter = new Hono();

mapsRouter.post('/publish', async (c) => {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json<PublishMapResponse | PublishMapErrorResponse>(
      {
        success: false,
        error: 'Request nie zawiera poprawnego JSON-u.',
      },
      400
    );
  }

  try {
    validateSaveMapRequest(body);

    const { map, postUrl } = await MapService.publishMap(body);

    return c.json<PublishMapResponse>(
      {
        success: true,
        postId: map.postId,
        postUrl,
      },
      201
    );
  } catch (error) {
    if (error instanceof MapValidationError) {
      return c.json<PublishMapResponse | PublishMapErrorResponse>(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }

    if (error instanceof MapServiceError) {
      return c.json<PublishMapResponse | PublishMapErrorResponse>(
        {
          success: false,
          error: error.message,
        },
        error.statusCode as ContentfulStatusCode
      );
    }

    console.error('Unhandled publish map error:', error);

    return c.json<PublishMapResponse | PublishMapErrorResponse>(
      {
        success: false,
        error: 'Wystąpił nieznany błąd serwera.',
      },
      500
    );
  }
});

mapsRouter.get('/current', async (c) => {
  try {
    const map = await MapService.getCurrentMap();

    if (!map) {
      return c.json<LoadCurrentMapResponse | LoadCurrentMapErrorResponse>(
        {
          success: false,
          error: 'Aktualny post nie ma przypisanej mapy.',
        },
        404
      );
    }

    return c.json<LoadCurrentMapResponse>({
      success: true,
      map,
    });
  } catch (error) {
    if (error instanceof MapServiceError) {
      return c.json<LoadCurrentMapResponse | LoadCurrentMapErrorResponse>(
        {
          success: false,
          error: error.message,
        },
        error.statusCode as ContentfulStatusCode
      );
    }

    console.error('Unhandled load map error:', error);

    return c.json<LoadCurrentMapResponse | LoadCurrentMapErrorResponse>(
      {
        success: false,
        error: 'Nie udało się pobrać mapy.',
      },
      500
    );
  }
});
