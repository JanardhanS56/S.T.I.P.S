import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { config } from '../config.js';
import { h, parse, uuid, HttpError, loadInCommunity } from '../http.js';
import { requireCommunity, requireNotMuted } from '../session.js';
import { screen, handleRejection } from '../moderation.js';

const r = Router();
r.use(requireCommunity);
const CATS = ['Notice', 'Event', 'Meme', 'Moment'];

r.get(
  '/',
  h(async (req, res) => {
    const { category, before, limit } = parse(
      z.object({
        category: z.enum(CATS).optional(),
        before: z
          .string()
          .refine((val) => !isNaN(Date.parse(val)), 'Invalid before cursor.')
          .optional(),
        limit: z.coerce.number().int().min(1).max(50).default(50)
      }),
      req.query
    );
    let q = db
      .from('posts')
      .select('id,category,body,created_at,author:users!author_id(username,display_name,role)')
      .eq('community_id', req.user.community_id)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (category) q = q.eq('category', category);
    if (before) q = q.lt('created_at', before);
    const { data, error } = await q;
    if (error) throw error;
    const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null;
    res.json({ posts: data, nextCursor });
  })
);

r.post(
  '/',
  requireNotMuted,
  h(async (req, res) => {
    const { body, category } = parse(
      z.object({
        body: z
          .string()
          .trim()
          .min(1, 'Write something first.')
          .max(config.postMaxChars, `Max ${config.postMaxChars} characters.`),
        category: z.enum(CATS)
      }),
      req.body
    );

    const since = new Date(Date.now() - 3600 * 1000).toISOString();
    const { count } = await db
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', req.user.id)
      .gte('created_at', since);
    if (count >= config.limits.postsPerHour) {
      res.setHeader('Retry-After', 3600);
      throw new HttpError(
        429,
        `You can post ${config.limits.postsPerHour} times an hour. Take a short break.`
      );
    }

    // Min gap 3s between posts by the same user
    const { data: latestPost } = await db
      .from('posts')
      .select('created_at')
      .eq('author_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestPost) {
      const elapsedMs = Date.now() - new Date(latestPost.created_at).getTime();
      if (elapsedMs < 3000) {
        const waitSec = Math.max(1, Math.ceil((3000 - elapsedMs) / 1000));
        res.setHeader('Retry-After', waitSec);
        throw new HttpError(429, 'Please wait a few seconds before posting again.');
      }
    }

    // Duplicate text guard: reject identical post text within 10 minutes by the same author
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: dup } = await db
      .from('posts')
      .select('id')
      .eq('author_id', req.user.id)
      .eq('body', body)
      .gte('created_at', tenMinAgo)
      .maybeSingle();
    if (dup) {
      throw new HttpError(409, 'You already posted that recently.');
    }

    const check = await screen(body);
    if (!check.ok) {
      await handleRejection(req.user, 'post');
      throw new HttpError(422, check.reason);
    }

    const { data, error } = await db
      .from('posts')
      .insert({
        community_id: req.user.community_id,
        author_id: req.user.id,
        category,
        body,
        status: 'visible'
      })
      .select('id')
      .single();
    if (error) throw error;
    res.status(201).json({ id: data.id });
  })
);

// Author or office can remove a post (it is hidden, not erased, so reports stay traceable).
r.delete(
  '/:id',
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const p = await loadInCommunity('posts', id, req, 'author_id,community_id');
    if (p.author_id !== req.user.id && req.user.role !== 'admin')
      throw new HttpError(403, 'Not allowed.');
    await db.from('posts').update({ status: 'hidden' }).eq('id', id);
    res.json({ ok: true });
  })
);

export default r;
