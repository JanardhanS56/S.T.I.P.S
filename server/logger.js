import { randomUUID } from 'node:crypto';
import pino from 'pino';
import pinoHttp from 'pino-http';

export const redactionPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'req.body',
  '*.body',
  '*.password',
  '*.current',
  '*.next',
  '*.token',
  '*.cookie',
  '*.authorization'
];

export function createLogger(opts = {}, stream) {
  return pino(
    {
      level:
        opts.level ||
        process.env.LOG_LEVEL ||
        (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
      redact: {
        paths: redactionPaths,
        censor: '[REDACTED]'
      },
      ...opts
    },
    stream
  );
}

export const logger = createLogger();

export function createHttpLogger(opts = {}, stream) {
  const baseLogger = opts.logger || (stream ? createLogger(opts, stream) : logger);
  return pinoHttp({
    logger: baseLogger,
    genReqId: (req, res) => {
      const existingId = req.headers['x-request-id'];
      const id = existingId || randomUUID();
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('X-Request-Id', id);
      }
      return id;
    },
    customProps: (req) => ({
      userId: req.user?.id,
      communityId: req.user?.community_id
    }),
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          query: req.query,
          headers: {
            host: req.headers.host,
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            'x-request-id': req.headers['x-request-id']
          }
        };
      }
    },
    ...opts
  });
}

export const httpLogger = createHttpLogger();
