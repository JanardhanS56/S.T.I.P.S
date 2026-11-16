import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Noop WebSocket transport for environments without native WebSocket (Node < 22).
// S.T.I.P.S uses polling for messaging (Decision D8) and does not use Supabase Realtime.
class NoopWebSocket {}

// Service role client. Server only. Never import this file from src/.
export const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: {
    transport: typeof WebSocket !== 'undefined' ? WebSocket : NoopWebSocket
  }
});

export { loadInCommunity } from './http.js';
