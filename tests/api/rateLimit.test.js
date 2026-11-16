import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { config } from '../../server/config.js';
import { logger } from '../../server/logger.js';
import { resetRateLimits, setRedisClient, checkRateLimit } from '../../server/rateLimit.js';
import { createMockDb } from '../helpers/mockDb.js';

let mockDb;
vi.mock('../../server/db.js', () => ({
  db: {
    from: (table) => mockDb.from(table)
  }
}));

const { default: app } = await import('../../server/app.js');

describe('Rate Limiting API Integration Tests (RATE-01..RATE-04)', () => {
  const originalGlobalRequests = config.rateLimits.global.requests;
  const originalLoginIpRequests = config.rateLimits.loginIp.requests;
  const originalLoginUserRequests = config.rateLimits.loginUser.requests;

  beforeEach(() => {
    mockDb = createMockDb();
    resetRateLimits();
    setRedisClient(null);
  });

  afterEach(() => {
    config.rateLimits.global.requests = originalGlobalRequests;
    config.rateLimits.loginIp.requests = originalLoginIpRequests;
    config.rateLimits.loginUser.requests = originalLoginUserRequests;
    resetRateLimits();
    setRedisClient(null);
    vi.restoreAllMocks();
  });

  describe('RATE-01: Global IP limiter with Retry-After and standard headers', () => {
    it('returns 429 and Retry-After header once the threshold is exceeded', async () => {
      config.rateLimits.global.requests = 3;

      for (let i = 1; i <= 3; i++) {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.headers['ratelimit-limit']).toBe('3');
        expect(res.headers['ratelimit-remaining']).toBe(String(3 - i));
        expect(res.headers['ratelimit-reset']).toBeDefined();
      }

      // 4th request must be throttled
      const blocked = await request(app).get('/api/health');
      expect(blocked.status).toBe(429);
      expect(blocked.headers['retry-after']).toBeDefined();
      expect(Number(blocked.headers['retry-after'])).toBeGreaterThanOrEqual(1);
      expect(blocked.headers['ratelimit-remaining']).toBe('0');
      expect(blocked.body.error).toContain('Too many requests');
    });
  });

  describe('RATE-02: Login limiter per IP and per username', () => {
    it('enforces rate limit per IP across different usernames', async () => {
      config.rateLimits.loginIp.requests = 2;
      config.rateLimits.loginUser.requests = 100;

      const res1 = await request(app)
        .post('/api/auth/login')
        .send({ username: 'user_one', password: 'TestPassword123!' });
      expect(res1.status).not.toBe(429);

      const res2 = await request(app)
        .post('/api/auth/login')
        .send({ username: 'user_two', password: 'TestPassword123!' });
      expect(res2.status).not.toBe(429);

      // 3rd attempt from same IP fails with 429
      const res3 = await request(app)
        .post('/api/auth/login')
        .send({ username: 'user_three', password: 'TestPassword123!' });
      expect(res3.status).toBe(429);
      expect(res3.headers['retry-after']).toBeDefined();
      expect(res3.body.error).toContain('Too many sign-in attempts');
    });

    it('enforces rate limit per username', async () => {
      config.rateLimits.loginIp.requests = 100;
      config.rateLimits.loginUser.requests = 2;

      const res1 = await request(app)
        .post('/api/auth/login')
        .send({ username: 'target_account', password: 'WrongPassword1!' });
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .post('/api/auth/login')
        .send({ username: 'target_account', password: 'WrongPassword2!' });
      expect(res2.status).toBe(401);

      // 3rd attempt for target_account fails with 429
      const res3 = await request(app)
        .post('/api/auth/login')
        .send({ username: 'target_account', password: 'WrongPassword3!' });
      expect(res3.status).toBe(429);
      expect(res3.headers['retry-after']).toBeDefined();
      expect(res3.body.error).toContain('Too many sign-in attempts');
    });
  });

  describe('RATE-03: Safe fallback when Redis is unavailable', () => {
    it('falls back safely to in-memory store and logs a warning when Redis errors', async () => {
      const warnSpy = vi.spyOn(logger, 'warn');

      const mockFailingRedis = {
        limit: vi.fn().mockRejectedValue(new Error('Redis connection timed out'))
      };
      setRedisClient(mockFailingRedis);

      // First check falls back to memory store and logs warning
      const result1 = await checkRateLimit({
        identifier: 'fallback-test-user',
        limit: 2,
        windowSeconds: 60,
        prefix: 'test'
      });

      expect(mockFailingRedis.limit).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalled();
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(1);

      // Second check also succeeds
      const result2 = await checkRateLimit({
        identifier: 'fallback-test-user',
        limit: 2,
        windowSeconds: 60,
        prefix: 'test'
      });
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(0);

      // Third check is blocked in memory
      const result3 = await checkRateLimit({
        identifier: 'fallback-test-user',
        limit: 2,
        windowSeconds: 60,
        prefix: 'test'
      });
      expect(result3.success).toBe(false);
      expect(result3.remaining).toBe(0);
    });

    it('handles simulated Redis outage inside Express request flow', async () => {
      const warnSpy = vi.spyOn(logger, 'warn');
      const mockFailingRedis = {
        limit: vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
      };
      setRedisClient(mockFailingRedis);

      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('RATE-04: Limits are read dynamically from server/config.js', () => {
    it('adapts behavior immediately when config is modified', async () => {
      config.rateLimits.global.requests = 1;

      const res1 = await request(app).get('/api/health');
      expect(res1.status).toBe(200);

      const res2 = await request(app).get('/api/health');
      expect(res2.status).toBe(429);

      // Dynamically raise the limit in config
      config.rateLimits.global.requests = 5;
      const res3 = await request(app).get('/api/health');
      expect(res3.status).toBe(200);
      expect(res3.headers['ratelimit-limit']).toBe('5');
    });
  });
});
