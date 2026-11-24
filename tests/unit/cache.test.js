import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCachedFeed, setCachedFeed, invalidateFeedCache } from '../../server/cache.js';
import * as rateLimitModule from '../../server/rateLimit.js';

describe('Feed Cache in Redis (PERF-01)', () => {
  beforeEach(() => {
    rateLimitModule.setRedisClient(null);
  });

  it('returns null when Redis client is not configured', async () => {
    const res = await getCachedFeed('comm-123');
    expect(res).toBeNull();
  });

  it('returns null on cache miss', async () => {
    const mockRedis = {
      get: vi.fn().mockResolvedValue(null)
    };
    rateLimitModule.setRedisClient(mockRedis);

    const res = await getCachedFeed('comm-123');
    expect(res).toBeNull();
    expect(mockRedis.get).toHaveBeenCalledWith('cache:posts:comm-123');
  });

  it('returns parsed feed object on cache hit', async () => {
    const mockFeed = { posts: [{ id: 'p1', body: 'hello' }], nextCursor: null };
    const mockRedis = {
      get: vi.fn().mockResolvedValue(JSON.stringify(mockFeed))
    };
    rateLimitModule.setRedisClient(mockRedis);

    const res = await getCachedFeed('comm-123');
    expect(res).toEqual(mockFeed);
  });

  it('handles redis read error safely without throwing', async () => {
    const mockRedis = {
      get: vi.fn().mockRejectedValue(new Error('Redis connection refused'))
    };
    rateLimitModule.setRedisClient(mockRedis);

    const res = await getCachedFeed('comm-123');
    expect(res).toBeNull();
  });

  it('sets cache with 15s TTL', async () => {
    const mockFeed = { posts: [{ id: 'p1', body: 'test' }], nextCursor: null };
    const mockRedis = {
      set: vi.fn().mockResolvedValue('OK')
    };
    rateLimitModule.setRedisClient(mockRedis);

    await setCachedFeed('comm-123', mockFeed, 15);
    expect(mockRedis.set).toHaveBeenCalledWith('cache:posts:comm-123', JSON.stringify(mockFeed), {
      ex: 15
    });
  });

  it('handles redis set error safely without throwing', async () => {
    const mockRedis = {
      set: vi.fn().mockRejectedValue(new Error('Quota exceeded'))
    };
    rateLimitModule.setRedisClient(mockRedis);

    await expect(setCachedFeed('comm-123', { posts: [] })).resolves.not.toThrow();
  });

  it('invalidates feed cache with redis.del', async () => {
    const mockRedis = {
      del: vi.fn().mockResolvedValue(1)
    };
    rateLimitModule.setRedisClient(mockRedis);

    await invalidateFeedCache('comm-123');
    expect(mockRedis.del).toHaveBeenCalledWith('cache:posts:comm-123');
  });

  it('handles redis del error safely without throwing', async () => {
    const mockRedis = {
      del: vi.fn().mockRejectedValue(new Error('Redis timeout'))
    };
    rateLimitModule.setRedisClient(mockRedis);

    await expect(invalidateFeedCache('comm-123')).resolves.not.toThrow();
  });
});
