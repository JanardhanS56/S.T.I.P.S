import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { h, parse, uuid, HttpError, loadInCommunity } from '../http.js';
import { requireCommunity, requireNotMuted, requireTerms } from '../session.js';
import { screen, handleRejection } from '../moderation.js';
import { enforcePollCap } from '../limits.js';

const r = Router();
r.use(requireCommunity);
r.use(requireTerms);

r.get(
  '/',
  h(async (req, res) => {
    const { data: polls, error } = await db
      .from('polls')
      .select(
        'id,question,closes_at,created_at,author:users!author_id(username,display_name,role),options:poll_options(id,label)'
      )
      .eq('community_id', req.user.community_id)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    const ids = polls.map((p) => p.id);
    const { data: votes } = ids.length
      ? await db.from('poll_votes').select('poll_id,user_id,option_id').in('poll_id', ids)
      : { data: [] };

    const now = Date.now();
    res.json({
      polls: polls.map((p) => {
        const mine =
          votes.find((v) => v.poll_id === p.id && v.user_id === req.user.id)?.option_id ?? null;
        const closed = new Date(p.closes_at).getTime() <= now;
        const showResults = closed || mine || req.user.role === 'admin'; // no peeking before you vote
        const pv = votes.filter((v) => v.poll_id === p.id);
        const total = pv.length;
        return {
          ...p,
          closed,
          myVote: mine,
          total: showResults ? total : null,
          options: p.options.map((o) => {
            const count = showResults ? pv.filter((v) => v.option_id === o.id).length : null;
            const percent = showResults
              ? total > 0
                ? Math.round((count / total) * 100)
                : 0
              : null;
            return {
              ...o,
              count,
              percent
            };
          })
        };
      })
    });
  })
);

r.post(
  '/',
  requireNotMuted,
  h(async (req, res) => {
    const { question, options, days } = parse(
      z.object({
        question: z.string().trim().min(5, 'Question is too short.').max(120),
        options: z.array(z.string().trim().min(1).max(60)).min(2, 'Add at least 2 options.').max(6),
        days: z.number().int().min(1).max(7)
      }),
      req.body
    );

    await enforcePollCap(req, res);

    const check = await screen([question, ...options].join('\n'));
    if (!check.ok) {
      await handleRejection(req.user, 'poll');
      throw new HttpError(422, check.reason);
    }

    const closes = new Date(Date.now() + days * 86400000).toISOString();
    const { data: poll, error } = await db
      .from('polls')
      .insert({
        community_id: req.user.community_id,
        author_id: req.user.id,
        question,
        closes_at: closes
      })
      .select('id')
      .single();
    if (error) throw error;
    const { error: optErr } = await db
      .from('poll_options')
      .insert(options.map((label) => ({ poll_id: poll.id, label })));
    if (optErr) throw optErr;
    res.status(201).json({ id: poll.id });
  })
);

r.post(
  '/:id/vote',
  requireNotMuted,
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const { optionId } = parse(z.object({ optionId: uuid }), req.body);
    const poll = await loadInCommunity('polls', id, req, 'id,community_id,closes_at,status');
    if (poll.status !== 'visible') throw new HttpError(404, 'Poll not found.');
    if (new Date(poll.closes_at) <= new Date()) throw new HttpError(409, 'This poll has closed.');
    const { data: opt } = await db
      .from('poll_options')
      .select('id')
      .eq('id', optionId)
      .eq('poll_id', id)
      .maybeSingle();
    if (!opt) throw new HttpError(400, 'Invalid option.');
    const { error } = await db
      .from('poll_votes')
      .insert({ poll_id: id, user_id: req.user.id, option_id: optionId });
    if (error?.code === '23505') throw new HttpError(409, 'You already voted in this poll.'); // primary key = one vote each
    if (error) throw error;
    res.status(201).json({ ok: true });
  })
);

// Author or admin can close a poll early
r.post(
  '/:id/close',
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const poll = await loadInCommunity(
      'polls',
      id,
      req,
      'id,author_id,community_id,status,closes_at'
    );
    if (poll.status !== 'visible') throw new HttpError(404, 'Poll not found.');
    if (poll.author_id !== req.user.id && req.user.role !== 'admin') {
      throw new HttpError(403, 'Not allowed.');
    }
    const now = new Date().toISOString();
    const { error: closeErr } = await db.from('polls').update({ closes_at: now }).eq('id', id);
    if (closeErr) throw closeErr;
    res.json({ ok: true, closes_at: now });
  })
);

export default r;
