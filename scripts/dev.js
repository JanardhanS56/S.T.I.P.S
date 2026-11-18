import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const serverScript = path.join(rootDir, 'server', 'dev.js');

// Load .env or .env.test into process.env safely if present without relying on CLI flags
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
    // If the env file cannot be parsed or read, rely on existing process.env
  }
}

console.log('='.repeat(50));
console.log('  S.T.I.P.S Local Development Server');
console.log('  • Frontend:    http://localhost:5173');
console.log('  • Backend API: http://localhost:3001');
console.log('='.repeat(50));
console.log('');

// 1. Start Backend API
// Never pass --env-file CLI flag: process.env is passed directly to child process,
// preventing Node exit code 9 crashes in CI / container environments where .env is absent.
const api = spawn(process.execPath, [serverScript], {
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
