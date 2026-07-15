import { context, reddit, redis } from '@devvit/web/server';

import type {
  MapStats,
  PublishedMap,
  SaveMapRequest,
} from '../../shared/types/savedMap';

import { mapKeys } from '../mapKeys';

export class MapServiceError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'MapServiceError';
    this.statusCode = statusCode;
  }
}

const sanitizeTitle = (title: string): string => title.trim().slice(0, 20);

export const MapService = {
  async publishMap(
    request: SaveMapRequest
  ): Promise<{ map: PublishedMap; postUrl: string }> {
    const userId = context.userId;
    const subredditName = context.subredditName;

    if (!userId) {
      throw new MapServiceError(
        'Musisz być zalogowany, aby opublikować mapę.',
        401
      );
    }

    if (!subredditName) {
      throw new MapServiceError('Nie udało się określić subreddita.', 400);
    }

    const lockKey = mapKeys.publishingLock(userId);

    const existingLock = await redis.get(lockKey);

    if (existingLock) {
      throw new MapServiceError('Publikowanie mapy już trwa.', 409);
    }

    await redis.set(lockKey, '1', {
      expiration: new Date(Date.now() + 30_000),
    });

    try {
      const title = sanitizeTitle(request.title);

      const post = await reddit.submitCustomPost({
        subredditName,
        title: `⚔️ ${title}`,
        entry: 'game',
        runAs: 'APP',
      });

      const publishedMap: PublishedMap = {
        title,
        rating: request.rating,
        tiles: request.tiles,
        enemies: request.enemies,
        postId: post.id,
        authorId: userId,
        createdAt: Date.now(),
        version: 1,
      };

      await redis.set(mapKeys.byPostId(post.id), JSON.stringify(publishedMap));

      await redis.zAdd(mapKeys.authorMaps(userId), {
        member: post.id,
        score: publishedMap.createdAt,
      });

      return { map: publishedMap, postUrl: post.url };
    } catch (error) {
      console.error('Could not publish map:', error);

      if (error instanceof MapServiceError) {
        throw error;
      }

      throw new MapServiceError('Nie udało się utworzyć posta z mapą.', 500);
    } finally {
      await redis.del(lockKey);
    }
  },

  async getCurrentMap(): Promise<PublishedMap | null> {
    const postId = context.postId;

    if (!postId) {
      return null;
    }

    const serializedMap = await redis.get(mapKeys.byPostId(postId));

    if (!serializedMap) {
      return null;
    }

    try {
      return JSON.parse(serializedMap) as PublishedMap;
    } catch (error) {
      console.error(`Invalid published map JSON for post ${postId}:`, error);

      throw new MapServiceError('Zapis mapy jest uszkodzony.', 500);
    }
  },

  async getStats(): Promise<MapStats> {
    const postId = context.postId;

    if (!postId) {
      return { played: 0, wins: 0, losses: 0 };
    }

    const raw = await redis.hGetAll(mapKeys.stats(postId));

    return {
      played: Number(raw.played ?? 0),
      wins: Number(raw.wins ?? 0),
      losses: Number(raw.losses ?? 0),
    };
  },

  async recordGameResult(result: 'win' | 'lost'): Promise<MapStats> {
    const postId = context.postId;

    if (!postId) {
      throw new MapServiceError('Nie udało się określić posta.', 400);
    }

    const key = mapKeys.stats(postId);

    await redis.hIncrBy(key, 'played', 1);
    await redis.hIncrBy(key, result === 'win' ? 'wins' : 'losses', 1);

    return MapService.getStats();
  },
};
