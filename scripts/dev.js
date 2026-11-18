import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const serverScript = path.join(rootDir, 'server', 'dev.js');

console.log('='.repeat(50));
console.log('  S.T.I.P.S Local Development Server');
console.log('  • Frontend:    http://localhost:5173');
console.log('  • Backend API: http://localhost:3001');
console.log('='.repeat(50));
console.log('');

// 1. Start Backend API
// Only pass --env-file when an env file exists on disk (avoids code 9 crash in CI / Docker)
const envFile =
  process.env.NODE_ENV === 'test' && fs.existsSync(path.join(rootDir, '.env.test'))
    ? '.env.test'
    : fs.existsSync(path.join(rootDir, '.env'))
      ? '.env'
      : null;

const apiArgs = envFile ? [`--env-file=${envFile}`, serverScript] : [serverScript];

const api = spawn(process.execPath, apiArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env }
});

// 2. Start Vite Frontend
const vite = spawn(process.execPath, [viteBin], {
  cwd: rootDir,
  stdio: 'inherit'
});

function cleanup(code = 0) {
  if (api && !api.killed) {
    try {
      api.kill();
    } catch {}
  }
  if (vite && !vite.killed) {
    try {
      vite.kill();
    } catch {}
  }
  process.exit(code);
}

api.on('error', (err) => {
  console.error('Failed to start backend API server:', err);
  cleanup(1);
});

vite.on('error', (err) => {
  console.error('Failed to start Vite frontend server:', err);
  cleanup(1);
});

api.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Backend API process exited with code ${code}`);
    cleanup(code);
  }
});

vite.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Vite frontend process exited with code ${code}`);
    cleanup(code);
  }
});

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));
