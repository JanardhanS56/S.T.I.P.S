import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { h, parse, uuid, HttpError } from '../http.js';
import { requireCommunity, requireTerms } from '../session.js';
import { enforceReportCap } from '../limits.js';

const r = Router();
r.use(requireCommunity);
r.use(requireTerms);

r.post(
  '/',
  h(async (req, res) => {
    const { targetType, targetId, reason } = parse(
      z.object({
        targetType: z.enum(['post', 'message', 'poll']),
        targetId: uuid,
        reason: z.string().trim().min(3).max(200)
      }),
      req.body
    );

    const targetTable =
      targetType === 'post' ? 'posts' : targetType === 'poll' ? 'polls' : 'messages';
    const { data: target, error: targetErr } = await db
      .from(targetTable)
      .select('id,community_id')
      .eq('id', targetId)
      .maybeSingle();
    if (targetErr) throw targetErr;
    if (!target || target.community_id !== req.user.community_id) {
      throw new HttpError(404, 'Target not found.');
    }

    await enforceReportCap(req, res);

    const { error: insertErr } = await db.from('reports').insert({
      community_id: req.user.community_id,
      reporter_id: req.user.id,
      target_type: targetType,
      target_id: targetId,
      reason
    });
    if (insertErr) throw insertErr;
    res.status(201).json({ ok: true });
  })
);

export default r;
