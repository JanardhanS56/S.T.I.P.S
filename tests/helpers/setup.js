import process from 'node:process';
import { guardAgainstProduction } from './prodGuard.js';

// Guarantee test environment
process.env.NODE_ENV = 'test';

// Fallback dummy credentials for unit tests when live test Supabase is not attached
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'http://localhost:54321';
  process.env.APPROVED_TEST_SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-for-local-unit-tests-only';
  process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long-for-testing';
}

// Invariant: Guard against executing tests against production databases
if (process.env.SUPABASE_URL && process.env.APPROVED_TEST_SUPABASE_URL) {
  guardAgainstProduction(process.env.SUPABASE_URL, process.env.NODE_ENV);
}
