import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from './env.js';
import { config } from './config.js';
import { logger } from './logger.js';

class MemoryStore {
  constructor() {
    this.hits = new Map();
  }

  limit(key, limit, windowSeconds) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const timestamps = (this.hits.get(key) || []).filter((t) => t > now - windowMs);

    if (timestamps.length >= limit) {
      const reset = (timestamps[0] || now) + windowMs;
      this.hits.set(key, timestamps);
      return {
        success: false,
        limit,
        remaining: 0,
        reset
      };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    const reset = timestamps[0] + windowMs;
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - timestamps.length),
      reset
    };
  }

  reset() {
    this.hits.clear();
  }
}

export const memoryStore = new MemoryStore();

let redisClient = null;
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN
  });
}

// Map of cached Upstash Ratelimit instances keyed by "prefix:tokens:window"
const ratelimitInstances = new Map();

export function setRedisClient(client) {
  redisClient = client;
  ratelimitInstances.clear();
}

export function getRedisClient() {
  return redisClient;
}

export function resetRateLimits() {
  memoryStore.reset();
  ratelimitInstances.clear();
}

function getUpstashLimiter(prefix, tokens, windowSeconds) {
  if (!redisClient) return null;
  if (typeof redisClient.limit === 'function') {
    return redisClient;
  }
  const cacheKey = `${prefix}:${tokens}:${windowSeconds}`;
  let limiter = ratelimitInstances.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(tokens, `${windowSeconds} s`),
      prefix
    });
    ratelimitInstances.set(cacheKey, limiter);
  }
  return limiter;
}

export async function checkRateLimit({ identifier, limit, windowSeconds, prefix = 'rl' }) {
  const upstashLimiter = getUpstashLimiter(prefix, limit, windowSeconds);

  if (upstashLimiter) {
    try {
      const result = await upstashLimiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset
      };
    } catch (err) {
      logger.warn(
        { error: err?.message, identifier, prefix },
        'Upstash Redis rate limiter failed; falling back to in-memory store'
      );
    }
  }

  // Safe in-memory fallback
  return memoryStore.limit(`${prefix}:${identifier}`, limit, windowSeconds);
}

function applyRateLimitHeaders(res, result) {
  const now = Date.now();
  const retryAfter = Math.max(1, Math.ceil((result.reset - now) / 1000));
  res.setHeader('RateLimit-Limit', result.limit);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', retryAfter);
  if (!result.success) {
    res.setHeader('Retry-After', retryAfter);
  }
}

export function createRateLimiter({
  getLimitConfig,
  getIdentifier,
  prefix = 'rl',
  errorMessage = 'Too many requests. Please slow down.'
}) {
  return async (req, res, next) => {
    try {
      const { requests, windowSeconds } = getLimitConfig();
      const identifier = getIdentifier(req);
      if (!identifier) {
        return next();
      }

      const result = await checkRateLimit({
        identifier,
        limit: requests,
        windowSeconds,
        prefix
      });

      applyRateLimitHeaders(res, result);

      if (!result.success) {
        return res.status(429).json({ error: errorMessage });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export const globalRateLimiter = createRateLimiter({
  getLimitConfig: () => config.rateLimits.global,
  getIdentifier: (req) => req.ip,
  prefix: 'global:ip',
  errorMessage: 'Too many requests. Please slow down.'
});

export const loginRateLimiter = async (req, res, next) => {
  try {
    const ipConfig = config.rateLimits.loginIp;
    const ipRes = await checkRateLimit({
      identifier: req.ip,
      limit: ipConfig.requests,
      windowSeconds: ipConfig.windowSeconds,
      prefix: 'login:ip'
    });

    applyRateLimitHeaders(res, ipRes);

    if (!ipRes.success) {
      return res.status(429).json({ error: 'Too many sign-in attempts. Try again later.' });
    }

    const username =
      typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : null;
    if (username) {
      const userConfig = config.rateLimits.loginUser;
      const userRes = await checkRateLimit({
        identifier: username,
        limit: userConfig.requests,
        windowSeconds: userConfig.windowSeconds,
        prefix: 'login:user'
      });

      // Update headers to reflect the more restrictive remaining count
      if (userRes.remaining < ipRes.remaining) {
        applyRateLimitHeaders(res, userRes);
      }

      if (!userRes.success) {
        applyRateLimitHeaders(res, userRes);
        return res.status(429).json({ error: 'Too many sign-in attempts. Try again later.' });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};
