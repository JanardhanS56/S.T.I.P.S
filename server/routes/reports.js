import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { config } from '../config.js';
import { h, parse, uuid, HttpError } from '../http.js';
import { requireCommunity } from '../session.js';

const r = Router();
r.use(requireCommunity);

r.post('/', h(async (req, res) => {
  const { targetType, targetId, reason } = parse(z.object({
    targetType: z.enum(['post', 'message', 'poll']), targetId: uuid, reason: z.string().trim().min(3).max(200),
  }), req.body);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await db.from('reports').select('id', { count: 'exact', head: true }).eq('reporter_id', req.user.id).gte('created_at', since);
  if (count >= config.limits.reportsPerDay) throw new HttpError(429, 'Report limit reached for today.');
  await db.from('reports').insert({ community_id: req.user.community_id, reporter_id: req.user.id, target_type: targetType, target_id: targetId, reason });
  res.status(201).json({ ok: true });
}));

export default r;
