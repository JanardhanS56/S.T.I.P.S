import { z } from 'zod';
import { logger } from './logger.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 does not catch async errors by itself; wrap every handler.
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, r.error.issues[0].message);
  return r.data;
}

export const uuid = z.string().uuid('Invalid id.');

export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  const reqId = req?.id || req?.headers?.['x-request-id'];
  const log = req?.log || logger;
  log.error({ err, reqId }, 'Unhandled server error');
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
