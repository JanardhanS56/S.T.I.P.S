// Local development server: node server/dev.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Safely load .env into process.env if present before importing app modules
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFileName =
  process.env.NODE_ENV === 'test' && fs.existsSync(path.join(rootDir, '.env.test'))
    ? '.env.test'
    : fs.existsSync(path.join(rootDir, '.env'))
      ? '.env'
      : null;

if (envFileName && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(rootDir, envFileName));
  } catch {
    // Rely on process.env
  }
}

const { default: app } = await import('./app.js');
const { config } = await import('./config.js');
const { logger } = await import('./logger.js');

app.get('/', (_req, res) => {
  res.redirect('http://localhost:5173');
});

app.listen(config.port, () => logger.info(`S.T.I.P.S API on http://localhost:${config.port}`));
