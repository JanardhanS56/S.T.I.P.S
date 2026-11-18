import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { config } from '../config.js';
import { h, parse, uuid, HttpError, loadInCommunity } from '../http.js';
import { requireCommunity, requireNotMuted, requireAdmin, requireTerms } from '../session.js';
import { screen, handleRejection } from '../moderation.js';
import { enforcePostCap, enforceReplyCap, enforceReactionCap } from '../limits.js';

const r = Router();
r.use(requireCommunity);
r.use(requireTerms);
const CATS = ['Notice', 'Event', 'Meme', 'Moment'];
const REACTION_KINDS = ['like', 'thanks', 'laugh'];

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
      .select(
        'id,category,body,created_at,pinned_at,is_official,author:users!author_id(username,display_name,role)'
      )
      .eq('community_id', req.user.community_id)
      .eq('status', 'visible')
      .order('pinned_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (category) q = q.eq('category', category);
    if (before) q = q.lt('created_at', before);
    const { data, error } = await q;
    if (error) throw error;

    const postIds = (data || []).map((p) => p.id);
    const reactionsMap = {};
    const myReactionsMap = {};
    if (postIds.length > 0) {
      const { data: rxData } = await db
        .from('post_reactions')
        .select('post_id,user_id,kind')
        .in('post_id', postIds);
      if (rxData) {
        for (const rx of rxData) {
          if (!reactionsMap[rx.post_id]) {
            reactionsMap[rx.post_id] = { like: 0, thanks: 0, laugh: 0 };
          }
          if (reactionsMap[rx.post_id][rx.kind] !== undefined) {
            reactionsMap[rx.post_id][rx.kind]++;
          }
          if (rx.user_id === req.user.id) {
            myReactionsMap[rx.post_id] = rx.kind;
          }
        }
      }
    }

    const posts = (data || []).map((p) => ({
      ...p,
      reactions: reactionsMap[p.id] || { like: 0, thanks: 0, laugh: 0 },
      myReaction: myReactionsMap[p.id] || null
    }));

    const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;
    res.json({ posts, nextCursor });
  })
);

r.post(
  '/',
  requireNotMuted,
  h(async (req, res) => {
    const { body, category, is_official } = parse(
      z.object({
        body: z
          .string()
          .trim()
          .min(1, 'Write something first.')
          .max(config.postMaxChars, `Max ${config.postMaxChars} characters.`),
        category: z.enum(CATS),
        is_official: z.boolean().optional()
      }),
      req.body
    );

    if (is_official && req.user.role !== 'admin') {
      throw new HttpError(403, 'Only admins can create official posts.');
    }

    await enforcePostCap(req, res);

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
        status: 'visible',
        is_official: Boolean(is_official),
        pinned_at: null
      })
      .select('id')
      .single();
    if (error) throw error;
    res.status(201).json({ id: data.id });
  })
);

r.get(
  '/:id',
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const p = await loadInCommunity(
      'posts',
      id,
      req,
      'id,category,body,created_at,status,author_id,community_id,pinned_at,is_official'
    );
    if (p.status !== 'visible') throw new HttpError(404, 'Post not found.');

    const { data: author } = await db
      .from('users')
      .select('username,display_name,role')
      .eq('id', p.author_id)
      .single();

    const { data: replies, error } = await db
      .from('post_replies')
      .select(
        'id,parent_id,post_id,body,created_at,author:users!author_id(username,display_name,role)'
      )
      .eq('post_id', id)
      .eq('community_id', req.user.community_id)
      .eq('status', 'visible')
      .order('created_at', { ascending: true });
    if (error) throw error;

    const { data: rxData } = await db
      .from('post_reactions')
      .select('user_id,kind')
      .eq('post_id', id);

    const reactions = { like: 0, thanks: 0, laugh: 0 };
    let myReaction = null;
    if (rxData) {
      for (const rx of rxData) {
        if (reactions[rx.kind] !== undefined) reactions[rx.kind]++;
        if (rx.user_id === req.user.id) myReaction = rx.kind;
      }
    }

    res.json({
      post: {
        id: p.id,
        category: p.category,
        body: p.body,
        created_at: p.created_at,
        pinned_at: p.pinned_at || null,
        is_official: Boolean(p.is_official),
        author: author || null,
        reactions,
        myReaction
      },
      replies: replies || []
    });
  })
);

r.post(
  '/:id/reactions',
  requireNotMuted,
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const post = await loadInCommunity('posts', id, req, 'id,community_id,status');
    if (post.status !== 'visible') throw new HttpError(404, 'Post not found.');

    const { kind } = parse(
      z.object({
        kind: z.enum(REACTION_KINDS)
      }),
      req.body
    );

    const { data: existing } = await db
      .from('post_reactions')
      .select('kind')
      .eq('post_id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (existing && existing.kind === kind) {
      // Toggle off: remove existing reaction
      await db.from('post_reactions').delete().eq('post_id', id).eq('user_id', req.user.id);
      return res.json({ reacted: false, kind: null });
    }

    await enforceReactionCap(req, res);

    if (existing) {
      // Switch reaction kind
      await db.from('post_reactions').update({ kind }).eq('post_id', id).eq('user_id', req.user.id);
      return res.json({ reacted: true, kind });
    }

    const { error } = await db.from('post_reactions').insert({
      post_id: id,
      user_id: req.user.id,
      community_id: req.user.community_id,
      kind
    });
    if (error) throw error;

    res.status(200).json({ reacted: true, kind });
  })
);

r.post(
  '/:id/replies',
  requireNotMuted,
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const post = await loadInCommunity('posts', id, req, 'id,community_id,status');
    if (post.status !== 'visible') throw new HttpError(404, 'Post not found.');

    const { body } = parse(
      z.object({
        body: z
          .string()
          .trim()
          .min(1, 'Write something first.')
          .max(config.postMaxChars, `Max ${config.postMaxChars} characters.`)
      }),
      req.body
    );

    await enforceReplyCap(req, res);

    const check = await screen(body);
    if (!check.ok) {
      await handleRejection(req.user, 'reply');
      throw new HttpError(422, check.reason);
    }

    const { data, error } = await db
      .from('post_replies')
      .insert({
        community_id: req.user.community_id,
        parent_id: id,
        post_id: id,
        author_id: req.user.id,
        body,
        status: 'visible'
      })
      .select('id')
      .single();
    if (error) throw error;

    res.status(201).json({ id: data.id });
  })
);

// Pin/unpin post (admin only)
r.post(
  '/:id/pin',
  requireAdmin,
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const { pinned } = parse(
      z.object({
        pinned: z.boolean().default(true)
      }),
      req.body || {}
    );
    const post = await loadInCommunity('posts', id, req, 'id,community_id,status,pinned_at');
    if (post.status !== 'visible') throw new HttpError(404, 'Post not found.');

    const pinned_at = pinned ? new Date().toISOString() : null;
    const { error: pinErr } = await db.from('posts').update({ pinned_at }).eq('id', id);
    if (pinErr) throw pinErr;
    res.json({ id, pinned: Boolean(pinned_at), pinned_at });
  })
);

// Official flag (admin only)
r.post(
  '/:id/official',
  requireAdmin,
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const { official } = parse(
      z.object({
        official: z.boolean().default(true)
      }),
      req.body || {}
    );
    const post = await loadInCommunity('posts', id, req, 'id,community_id,status,is_official');
    if (post.status !== 'visible') throw new HttpError(404, 'Post not found.');

    const { error: officialErr } = await db
      .from('posts')
      .update({ is_official: official })
      .eq('id', id);
    if (officialErr) throw officialErr;
    res.json({ id, is_official: official });
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
    const { error: delErr } = await db.from('posts').update({ status: 'hidden' }).eq('id', id);
    if (delErr) throw delErr;
    res.json({ ok: true });
  })
);

export default r;
