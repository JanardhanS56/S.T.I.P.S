import { db } from './db.js';
import { config } from './config.js';
import { HttpError } from './http.js';

export async function checkUserCap({
  table,
  userId,
  userColumn = 'author_id',
  limit,
  windowSeconds
}) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count, error } = await db
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(userColumn, userId)
    .gte('created_at', since);

  if (error) throw error;

  const currentCount = count || 0;
  const remaining = Math.max(0, limit - currentCount);
  const exceeded = currentCount >= limit;

  return {
    exceeded,
    limit,
    currentCount,
    remaining,
    retryAfterSeconds: windowSeconds
  };
}

export async function enforceUserCap(
  res,
  { table, userId, userColumn = 'author_id', limit, windowSeconds, errorMessage }
) {
  const result = await checkUserCap({
    table,
    userId,
    userColumn,
    limit,
    windowSeconds
  });

  if (result.exceeded) {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', result.retryAfterSeconds);
    }
    throw new HttpError(429, errorMessage || 'Limit reached. Please try again later.');
  }

  return result;
}

export async function enforcePostCap(req, res) {
  return enforceUserCap(res, {
    table: 'posts',
    userId: req.user.id,
    userColumn: 'author_id',
    limit: config.limits.postsPerHour,
    windowSeconds: 3600,
    errorMessage: `You can post ${config.limits.postsPerHour} times an hour. Take a short break.`
  });
}

export async function enforcePollCap(req, res) {
  return enforceUserCap(res, {
    table: 'polls',
    userId: req.user.id,
    userColumn: 'author_id',
    limit: config.limits.pollsPerDay,
    windowSeconds: 24 * 3600,
    errorMessage: `You can start ${config.limits.pollsPerDay} polls a day.`
  });
}

export async function enforceMessageCap(req, res) {
  return enforceUserCap(res, {
    table: 'messages',
    userId: req.user.id,
    userColumn: 'sender_id',
    limit: config.limits.messagesPerHour,
    windowSeconds: 3600,
    errorMessage: 'Message limit reached for this hour.'
  });
}

export async function enforceReportCap(req, res) {
  return enforceUserCap(res, {
    table: 'reports',
    userId: req.user.id,
    userColumn: 'reporter_id',
    limit: config.limits.reportsPerDay,
    windowSeconds: 24 * 3600,
    errorMessage: 'Report limit reached for today.'
  });
}

export async function enforceReplyCap(req, res) {
  return enforceUserCap(res, {
    table: 'replies',
    userId: req.user.id,
    userColumn: 'author_id',
    limit: config.limits.repliesPerHour,
    windowSeconds: 3600,
    errorMessage: `You can reply ${config.limits.repliesPerHour} times an hour. Take a short break.`
  });
}

export async function enforceReactionCap(req, res) {
  return enforceUserCap(res, {
    table: 'reactions',
    userId: req.user.id,
    userColumn: 'user_id',
    limit: config.limits.reactionsPerHour,
    windowSeconds: 3600,
    errorMessage: `Reaction limit reached for this hour.`
  });
}
