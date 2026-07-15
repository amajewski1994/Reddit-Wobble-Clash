export const mapKeys = {
  byPostId: (postId: string): string => `published-map:post:${postId}`,

  publishingLock: (userId: string): string =>
    `published-map:publishing:${userId}`,

  authorMaps: (userId: string): string => `published-map:author:${userId}`,

  stats: (postId: string): string => `published-map:stats:${postId}`,
};
