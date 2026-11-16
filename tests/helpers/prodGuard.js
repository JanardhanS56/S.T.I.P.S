import process from 'node:process';

// Invariant: Tests and test seeds refuse to run against production database
export function guardAgainstProduction(supabaseUrl, nodeEnv = process.env.NODE_ENV) {
  if (nodeEnv === 'production') {
    throw new Error('FATAL: Operation cannot run in production mode (NODE_ENV=production).');
  }

  const prodKeywords = ['production', 'prod-'];
  const urlLower = (supabaseUrl || '').toLowerCase();
  for (const kw of prodKeywords) {
    if (urlLower.includes(kw)) {
      throw new Error(`FATAL: SUPABASE_URL (${supabaseUrl}) appears to be a production database.`);
    }
  }

  if (process.env.PROD_SUPABASE_URL && process.env.PROD_SUPABASE_URL === supabaseUrl) {
    throw new Error('FATAL: SUPABASE_URL matches PROD_SUPABASE_URL. Operation aborted.');
  }
}
