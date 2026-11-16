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
