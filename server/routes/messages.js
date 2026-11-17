import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { config } from '../config.js';
import { h, parse, uuid, HttpError } from '../http.js';
import { requireCommunity, requireNotMuted } from '../session.js';
import { screen, handleRejection } from '../moderation.js';
import { enforceMessageCap } from '../limits.js';

const r = Router();
r.use(requireCommunity);

// Block management
r.get(
  '/blocks',
  h(async (req, res) => {
    const { data, error } = await db
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', req.user.id);
    if (error) throw error;
    res.json({ blocked: (data || []).map((b) => b.blocked_id) });
  })
);

r.post(
  '/blocks/:userId',
  h(async (req, res) => {
    const targetId = parse(uuid, req.params.userId);
    if (targetId === req.user.id) {
      throw new HttpError(400, 'Cannot block yourself.');
    }
    const { data: targetUser } = await db
      .from('users')
      .select('id,community_id')
      .eq('id', targetId)
      .maybeSingle();
    if (!targetUser || targetUser.community_id !== req.user.community_id) {
      throw new HttpError(404, 'Person not found.');
    }

    const { error } = await db.from('user_blocks').insert({
      blocker_id: req.user.id,
      blocked_id: targetId
    });
    if (error) throw error;
    res.json({ ok: true, blocked: true });
  })
);

r.delete(
  '/blocks/:userId',
  h(async (req, res) => {
    const targetId = parse(uuid, req.params.userId);
    await db.from('user_blocks').delete().eq('blocker_id', req.user.id).eq('blocked_id', targetId);
    res.json({ ok: true, blocked: false });
  })
);

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

    // Filter out users who have blocked current user or whom current user has blocked
    const { data: blocks } = await db
      .from('user_blocks')
      .select('blocker_id,blocked_id')
      .or(`blocker_id.eq.${req.user.id},blocked_id.eq.${req.user.id}`);
    const blockedIds = new Set();
    if (blocks) {
      for (const b of blocks) {
        if (b.blocker_id === req.user.id) blockedIds.add(b.blocked_id);
        if (b.blocked_id === req.user.id) blockedIds.add(b.blocker_id);
      }
    }
    const people = (data || []).filter((p) => !blockedIds.has(p.id));
    res.json({ people });
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

    const { data: blocks } = await db
      .from('user_blocks')
      .select('blocker_id,blocked_id')
      .or(
        `and(blocker_id.eq.${me},blocked_id.eq.${other}),and(blocker_id.eq.${other},blocked_id.eq.${me})`
      );
    const isBlocked = (blocks || []).some((b) => b.blocker_id === me && b.blocked_id === other);
    const isBlockedBy = (blocks || []).some((b) => b.blocker_id === other && b.blocked_id === me);

    // Mark unread incoming messages as read
    await db
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('community_id', req.user.community_id)
      .eq('sender_id', other)
      .eq('recipient_id', me)
      .is('read_at', null);

    res.json({
      messages: data.map((m) => ({
        id: m.id,
        body: m.body,
        at: m.created_at,
        mine: m.sender_id === me
      })),
      isBlocked,
      isBlockedBy
    });
  })
);

r.post(
  '/with/:userId/read',
  h(async (req, res) => {
    const other = parse(uuid, req.params.userId);
    const me = req.user.id;
    await db
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('community_id', req.user.community_id)
      .eq('sender_id', other)
      .eq('recipient_id', me)
      .is('read_at', null);
    res.json({ ok: true });
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

    // Enforce user block rules
    const { data: block } = await db
      .from('user_blocks')
      .select('blocker_id')
      .or(
        `and(blocker_id.eq.${req.user.id},blocked_id.eq.${toUserId}),and(blocker_id.eq.${toUserId},blocked_id.eq.${req.user.id})`
      )
      .maybeSingle();
    if (block) {
      throw new HttpError(403, 'Cannot message this user.');
    }

    await enforceMessageCap(req, res);

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
