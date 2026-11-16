import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { config } from '../config.js';
import { h, parse, uuid, HttpError } from '../http.js';
import { requireCommunity, requireNotMuted } from '../session.js';
import { screen, handleRejection } from '../moderation.js';

const r = Router();
r.use(requireCommunity);

// People you may message: everyone in your community who the DM rule allows.
r.get(
  '/people',
  h(async (req, res) => {
    let q = db
      .from('users')
      .select('id,username,display_name,role')
      .eq('community_id', req.user.community_id)
      .eq('status', 'active')
      .neq('id', req.user.id)
      .order('display_name');
    if (config.dmRule === 'teacher-student' && req.user.role === 'student')
      q = q.in('role', ['teacher', 'admin']);
    const { data } = await q;
    res.json({ people: data });
  })
);

r.get(
  '/threads',
  h(async (req, res) => {
    const me = req.user.id;
    const { data } = await db
      .from('messages')
      .select(
        'id,body,created_at,sender_id,recipient_id,sender:users!sender_id(id,username,display_name,role),recipient:users!recipient_id(id,username,display_name,role)'
      )
      .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
      .order('created_at', { ascending: false })
      .limit(200);
    const seen = new Map();
    for (const m of data) {
      const other = m.sender_id === me ? m.recipient : m.sender;
      if (!seen.has(other.id)) seen.set(other.id, { with: other, last: m.body, at: m.created_at });
    }
    res.json({ threads: [...seen.values()] });
  })
);

r.get(
  '/with/:userId',
  h(async (req, res) => {
    const other = parse(uuid, req.params.userId);
    const { data: otherUser } = await db
      .from('users')
      .select('id,community_id,status')
      .eq('id', other)
      .maybeSingle();
    if (
      !otherUser ||
      otherUser.community_id !== req.user.community_id ||
      otherUser.status === 'suspended'
    ) {
      throw new HttpError(404, 'Person not found.');
    }
    const me = req.user.id;
    const { data } = await db
      .from('messages')
      .select('id,body,created_at,sender_id')
      .eq('community_id', req.user.community_id)
      .or(
        `and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`
      )
      .order('created_at', { ascending: true })
      .limit(200);
    res.json({
      messages: data.map((m) => ({
        id: m.id,
        body: m.body,
        at: m.created_at,
        mine: m.sender_id === me
      }))
    });
  })
);

r.post(
  '/',
  requireNotMuted,
  h(async (req, res) => {
    const { toUserId, body } = parse(
      z.object({ toUserId: uuid, body: z.string().trim().min(1).max(config.messageMaxChars) }),
      req.body
    );
    if (toUserId === req.user.id) {
      throw new HttpError(400, 'Cannot message yourself.');
    }
    const { data: to } = await db
      .from('users')
      .select('id,role,community_id,status')
      .eq('id', toUserId)
      .maybeSingle();
    if (!to || to.community_id !== req.user.community_id || to.status !== 'active')
      throw new HttpError(404, 'Person not found.');
    if (config.dmRule === 'teacher-student' && req.user.role === 'student' && to.role === 'student')
      throw new HttpError(403, 'Students can message teachers and the office.');

    const since = new Date(Date.now() - 3600 * 1000).toISOString();
    const { count } = await db
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', req.user.id)
      .gte('created_at', since);
    if (count >= config.limits.messagesPerHour)
      throw new HttpError(429, 'Message limit reached for this hour.');

    const check = await screen(body); // also blocks phone numbers and emails
    if (!check.ok) {
      await handleRejection(req.user, 'message');
      throw new HttpError(422, check.reason);
    }

    await db.from('messages').insert({
      community_id: req.user.community_id,
      sender_id: req.user.id,
      recipient_id: toUserId,
      body
    });
    res.status(201).json({ ok: true });
  })
);

export default r;
