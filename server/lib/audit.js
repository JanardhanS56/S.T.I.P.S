import { db } from '../db.js';

/**
 * Log an administrative action to the audit_log table.
 * @param {import('express').Request} req
 * @param {string} action
 * @param {{ type?: string, target_type?: string, id?: string, target_id?: string }} [target]
 * @param {Record<string, unknown>} [meta]
 */
export async function audit(req, action, target = {}, meta = {}) {
  const { data, error } = await db.from('audit_log').insert({
    community_id: req.user.community_id,
    actor_id: req.user.id,
    action,
    target_type: target.type || target.target_type || 'system',
    target_id: target.id || target.target_id || null,
    meta: meta || {}
  });
  if (error) throw error;
  return data;
}
