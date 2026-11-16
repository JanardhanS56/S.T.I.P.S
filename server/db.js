import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Service role client. Server only. Never import this file from src/.
export const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

export { loadInCommunity } from './http.js';
