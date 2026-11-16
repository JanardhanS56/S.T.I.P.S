import { db } from '../db.js';
import { config } from '../config.js';

// In-memory sliding window for moderation rejections per user
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

export async function handleRejection(user, targetType = 'post') {
  if (!user || !user.id) return { muted: false, count: 0 };
  const count = recordRejection(user.id, (config.limits?.autoMuteWindowSeconds ?? 3600) * 1000);
  const threshold = config.limits?.autoMuteThreshold ?? 5;

  if (count >= threshold) {
    await db.from('users').update({ status: 'muted' }).eq('id', user.id);
    user.status = 'muted';

    await db.from('reports').insert({
      community_id: user.community_id,
      reporter_id: user.id,
      target_type: targetType,
      target_id: user.id,
      reason: 'Auto-muted: 5 moderation rejections in 1 hour',
      status: 'open'
    });

    return { muted: true, count };
  }

  return { muted: false, count };
}
