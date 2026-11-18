import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { config } from '../config.js';
import { getRedisClient } from '../rateLimit.js';
import { logger } from '../logger.js';

const VALID_REPORT_TARGETS = new Set(['post', 'message', 'poll']);

// In-memory sliding window fallback for moderation rejections per user
const rejections = new Map();

export function recordRejection(
  userId,
  windowMs = (config.limits?.autoMuteWindowSeconds ?? 3600) * 1000
) {
  if (!userId) return 0;
  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (rejections.get(userId) || []).filter((ts) => ts > cutoff);
  timestamps.push(now);
  rejections.set(userId, timestamps);
  return timestamps.length;
}

export function getRejectionCount(
  userId,
  windowMs = (config.limits?.autoMuteWindowSeconds ?? 3600) * 1000
) {
  if (!userId) return 0;
  const cutoff = Date.now() - windowMs;
  const timestamps = (rejections.get(userId) || []).filter((ts) => ts > cutoff);
  rejections.set(userId, timestamps);
  return timestamps.length;
}

export function clearRejections(userId) {
  if (userId) {
    rejections.delete(userId);
  } else {
    rejections.clear();
  }
}

async function recordRejectionDistributed(userId, windowSeconds) {
  const redis = getRedisClient();
  if (
    redis &&
    typeof redis.zadd === 'function' &&
    typeof redis.zremrangebyscore === 'function' &&
    typeof redis.zcard === 'function' &&
    typeof redis.expire === 'function'
  ) {
    const key = `mod:reject:${userId}`;
    const now = Date.now();
    const cutoff = now - windowSeconds * 1000;
    try {
      await redis.zadd(key, { score: now, member: `${now}:${randomUUID()}` });
      await redis.zremrangebyscore(key, 0, cutoff);
      const count = await redis.zcard(key);
      await redis.expire(key, windowSeconds);
      return Number(count) || 0;
    } catch (err) {
      logger.warn(
        { error: err?.message, userId },
        'Redis rejection counter failed; falling back to in-memory store'
      );
    }
  }
  return recordRejection(userId, windowSeconds * 1000);
}

export async function handleRejection(user, targetType = 'post') {
  if (!user || !user.id) return { muted: false, count: 0 };
  const windowSeconds = config.limits?.autoMuteWindowSeconds ?? 3600;
  const count = await recordRejectionDistributed(user.id, windowSeconds);
  const threshold = config.limits?.autoMuteThreshold ?? 5;

  if (count >= threshold) {
    const { error: muteErr } = await db.from('users').update({ status: 'muted' }).eq('id', user.id);
    if (muteErr) {
      logger.error({ err: muteErr, userId: user.id }, 'Failed to persist auto-mute status');
    }
    user.status = 'muted';

    const reportTargetType = VALID_REPORT_TARGETS.has(targetType) ? targetType : 'post';
    const { error: reportErr } = await db.from('reports').insert({
      community_id: user.community_id,
      reporter_id: user.id,
      target_type: reportTargetType,
      target_id: user.id,
      reason: 'Auto-muted: 5 moderation rejections in 1 hour',
      status: 'open'
    });
    if (reportErr) {
      logger.error({ err: reportErr, userId: user.id }, 'Failed to insert auto-mute system report');
    }

    return { muted: true, count };
  }

  return { muted: false, count };
}
