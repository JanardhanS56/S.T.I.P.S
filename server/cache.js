import { getRedisClient } from './rateLimit.js';
import { logger } from './logger.js';

const FEED_CACHE_TTL_SECONDS = 15;

/**
 * Gets cached default feed data for a community.
 * Returns null if cache miss, redis unavailable, or on error.
 */
export async function getCachedFeed(communityId) {
  if (!communityId) return null;
  const redis = getRedisClient();
  if (!redis || typeof redis.get !== 'function') return null;

  try {
    const raw = await redis.get(`cache:posts:${communityId}`);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err) {
    logger.warn({ error: err?.message, communityId }, 'Failed to read feed cache from Redis');
    return null;
  }
}

/**
 * Sets cached default feed data for a community.
 * Silently catches errors to guarantee fail-open behavior.
 */
export async function setCachedFeed(communityId, data, ttlSeconds = FEED_CACHE_TTL_SECONDS) {
  if (!communityId || !data) return;
  const redis = getRedisClient();
  if (!redis || typeof redis.set !== 'function') return;

  try {
    const payload = JSON.stringify(data);
    await redis.set(`cache:posts:${communityId}`, payload, { ex: ttlSeconds });
  } catch (err) {
    logger.warn({ error: err?.message, communityId }, 'Failed to set feed cache in Redis');
  }
}

/**
 * Invalidates cached feed for a community.
 * Silently catches errors to guarantee fail-open behavior.
 */
export async function invalidateFeedCache(communityId) {
  if (!communityId) return;
  const redis = getRedisClient();
  if (!redis || typeof redis.del !== 'function') return;

  try {
    await redis.del(`cache:posts:${communityId}`);
  } catch (err) {
    logger.warn({ error: err?.message, communityId }, 'Failed to invalidate feed cache in Redis');
  }
}
