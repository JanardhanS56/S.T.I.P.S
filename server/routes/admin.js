import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { h, parse, uuid, HttpError } from '../http.js';
import { requireCommunity, requireAdmin } from '../session.js';

const r = Router();
r.use(requireAdmin, requireCommunity);

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; // no look-alike characters
const tempPassword = () => Array.from({ length: 12 }, () => CHARS[randomInt(CHARS.length)]).join('');
const slug = (name) => name.toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '').replace(/\.+/g, '.').replace(/^\.|\.$/g, '').slice(0, 26);

// Create accounts in bulk. Passwords are shown ONCE in this response and stored only as hashes.
r.post('/members', h(async (req, res) => {
  const { members } = parse(z.object({
    members: z.array(z.object({ name: z.string().trim().min(1).max(60), role: z.enum(['teacher', 'student']), department: z.string().trim().max(60).optional() })).min(1).max(200),
  }), req.body);

  const created = [];
  for (const m of members) {
    const base = slug(m.name) || 'user';
    let username = base;
    for (let i = 0; i < 8; i++) {
      const { data: taken } = await db.from('users').select('id').eq('username', username).maybeSingle();
      if (!taken) break;
      username = `${base}${randomInt(10, 99)}`;
    }
    const password = tempPassword();
    const { error } = await db.from('users').insert({
      community_id: req.user.community_id, username, display_name: m.name, role: m.role,
      department: m.department ?? '', password_hash: await bcrypt.hash(password, 10), must_change_password: true,
    });
    if (error) throw error;
    created.push({ name: m.name, role: m.role, username, password });
  }
  res.status(201).json({ created });
}));

r.get('/community', h(async (req, res) => {
  const { data } = await db.from('communities').select('id,name,code').eq('id', req.user.community_id).single();
  res.json({ community: data });
}));

r.get('/reports', h(async (req, res) => {
  const { data } = await db.from('reports').select('id,target_type,target_id,reason,status,created_at,reporter:users!reporter_id(username)')
    .eq('community_id', req.user.community_id).eq('status', 'open').order('created_at', { ascending: false }).limit(50);
  res.json({ reports: data });
}));

r.post('/reports/:id/resolve', h(async (req, res) => {
  const id = parse(uuid, req.params.id);
  const { action } = parse(z.object({ action: z.enum(['hide', 'dismiss']) }), req.body);
  const { data: rep } = await db.from('reports').select('*').eq('id', id).eq('community_id', req.user.community_id).maybeSingle();
  if (!rep) throw new HttpError(404, 'Report not found.');
  if (action === 'hide' && rep.target_type === 'post') await db.from('posts').update({ status: 'hidden' }).eq('id', rep.target_id);
  if (action === 'hide' && rep.target_type === 'poll') await db.from('polls').update({ status: 'hidden' }).eq('id', rep.target_id);
  await db.from('reports').update({ status: action === 'hide' ? 'actioned' : 'dismissed' }).eq('id', id);
  res.json({ ok: true });
}));

r.post('/users/:id/status', h(async (req, res) => {
  const id = parse(uuid, req.params.id);
  const { status } = parse(z.object({ status: z.enum(['active', 'muted', 'suspended']) }), req.body);
  const { data: u } = await db.from('users').select('id,role,community_id').eq('id', id).maybeSingle();
  if (!u || u.community_id !== req.user.community_id || u.role === 'admin') throw new HttpError(404, 'User not found.');
  await db.from('users').update({ status }).eq('id', id);
  res.json({ ok: true });
}));

r.post('/users/:id/reset-password', h(async (req, res) => {
  const id = parse(uuid, req.params.id);
  const { data: u } = await db.from('users').select('id,role,community_id').eq('id', id).maybeSingle();
  if (!u || u.community_id !== req.user.community_id || u.role === 'admin') throw new HttpError(404, 'User not found.');
  const password = tempPassword();
  await db.from('users').update({ password_hash: await bcrypt.hash(password, 10), must_change_password: true, failed_attempts: 0, locked_until: null }).eq('id', id);
  res.json({ password });
}));

export default r;
