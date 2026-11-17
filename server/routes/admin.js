import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { h, parse, uuid, HttpError, loadInCommunity } from '../http.js';
import { requireCommunity, requireAdmin } from '../session.js';
import { slug } from '../lib/slug.js';
import { audit } from '../lib/audit.js';

const r = Router();
r.use(requireAdmin, requireCommunity);

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; // no look-alike characters
const tempPassword = () =>
  Array.from({ length: 12 }, () => CHARS[randomInt(CHARS.length)]).join('');

// Create accounts in bulk. Passwords are shown ONCE in this response and stored only as hashes.
r.post(
  '/members',
  h(async (req, res) => {
    const { members } = parse(
      z.object({
        members: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(60),
              role: z.enum(['teacher', 'student']),
              department: z.string().trim().max(60).optional()
            })
          )
          .min(1)
          .max(200)
      }),
      req.body
    );

    const created = [];
    for (const m of members) {
      const base = slug(m.name) || 'user';
      let username = base;
      for (let i = 0; i < 8; i++) {
        const { data: taken } = await db
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle();
        if (!taken) break;
        username = `${base}${randomInt(10, 99)}`;
      }
      const password = tempPassword();
      const { error } = await db.from('users').insert({
        community_id: req.user.community_id,
        username,
        display_name: m.name,
        role: m.role,
        department: m.department ?? '',
        password_hash: await bcrypt.hash(password, 10),
        must_change_password: true
      });
      if (error) throw error;
      created.push({ name: m.name, role: m.role, username, password });
    }
    await audit(
      req,
      'members_create',
      { type: 'community', id: req.user.community_id },
      { count: created.length, usernames: created.map((c) => c.username) }
    );
    res.status(201).json({ created });
  })
);

// List members in the admin's community
r.get(
  '/members',
  h(async (req, res) => {
    const { data: members, error } = await db
      .from('users')
      .select('id,username,display_name,role,status,department,created_at')
      .eq('community_id', req.user.community_id)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    const safeMembers = (members || []).map((m) => ({
      id: m.id,
      username: m.username,
      display_name: m.display_name,
      role: m.role,
      status: m.status,
      department: m.department,
      created_at: m.created_at
    }));
    res.json({ members: safeMembers });
  })
);

r.get(
  '/community',
  h(async (req, res) => {
    const { data } = await db
      .from('communities')
      .select('id,name,code')
      .eq('id', req.user.community_id)
      .single();
    res.json({ community: data });
  })
);

r.get(
  '/reports',
  h(async (req, res) => {
    const { data } = await db
      .from('reports')
      .select(
        'id,target_type,target_id,reason,status,created_at,reporter:users!reporter_id(username)'
      )
      .eq('community_id', req.user.community_id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50);
    res.json({ reports: data });
  })
);

r.post(
  '/reports/:id/resolve',
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const { action } = parse(z.object({ action: z.enum(['hide', 'dismiss']) }), req.body);
    const { data: rep } = await db
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('community_id', req.user.community_id)
      .maybeSingle();
    if (!rep) throw new HttpError(404, 'Report not found.');
    if (action === 'hide' && rep.target_type === 'post')
      await db.from('posts').update({ status: 'hidden' }).eq('id', rep.target_id);
    if (action === 'hide' && rep.target_type === 'poll')
      await db.from('polls').update({ status: 'hidden' }).eq('id', rep.target_id);
    await db
      .from('reports')
      .update({ status: action === 'hide' ? 'actioned' : 'dismissed' })
      .eq('id', id);
    await audit(
      req,
      action === 'hide' ? 'report_hide' : 'report_dismiss',
      { type: rep.target_type, id: rep.target_id },
      { report_id: id, action }
    );
    res.json({ ok: true });
  })
);

r.post(
  '/users/:id/status',
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const { status } = parse(
      z.object({ status: z.enum(['active', 'muted', 'suspended']) }),
      req.body
    );
    const { data: u } = await db
      .from('users')
      .select('id,username,role,community_id,status')
      .eq('id', id)
      .maybeSingle();
    if (!u || u.community_id !== req.user.community_id || u.role === 'admin')
      throw new HttpError(404, 'User not found.');
    await db.from('users').update({ status }).eq('id', id);
    await audit(
      req,
      'user_status_change',
      { type: 'user', id },
      { status, previous_status: u.status, username: u.username }
    );
    res.json({ ok: true });
  })
);

r.post(
  '/users/:id/reset-password',
  h(async (req, res) => {
    const id = parse(uuid, req.params.id);
    const { data: u } = await db
      .from('users')
      .select('id,username,role,community_id,token_version')
      .eq('id', id)
      .maybeSingle();
    if (!u || u.community_id !== req.user.community_id || u.role === 'admin')
      throw new HttpError(404, 'User not found.');
    const password = tempPassword();
    await db
      .from('users')
      .update({
        password_hash: await bcrypt.hash(password, 10),
        must_change_password: true,
        failed_attempts: 0,
        locked_until: null,
        token_version: (u.token_version ?? 0) + 1
      })
      .eq('id', id);
    await audit(req, 'user_password_reset', { type: 'user', id }, { username: u.username });
    res.json({ password });
  })
);

// Pin or unpin a post
r.post(
  '/posts/:id/pin',
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
    await db.from('posts').update({ pinned_at }).eq('id', id);
    await audit(req, pinned ? 'post_pin' : 'post_unpin', { type: 'post', id }, { pinned });
    res.json({ id, pinned: Boolean(pinned_at), pinned_at });
  })
);

// Mark or unmark official post
r.post(
  '/posts/:id/official',
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

    await db.from('posts').update({ is_official: official }).eq('id', id);
    await audit(
      req,
      official ? 'post_official' : 'post_unofficial',
      { type: 'post', id },
      { official }
    );
    res.json({ id, is_official: official });
  })
);

// Retrieve community audit log
r.get(
  '/audit',
  h(async (req, res) => {
    const { data: entries, error } = await db
      .from('audit_log')
      .select(
        'id,action,target_type,target_id,meta,created_at,actor:users!actor_id(id,username,display_name,role)'
      )
      .eq('community_id', req.user.community_id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ audit: entries });
  })
);

export default r;
