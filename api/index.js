// Vercel entry point: one serverless function that hosts the whole Express API.
// (Vercel's free plan limits the number of functions, so we keep a single one.)
import app from '../server/app.js';
export default app;
