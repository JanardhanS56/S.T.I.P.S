// Local development server: node --env-file=.env server/dev.js
import app from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';

app.get('/', (_req, res) => {
  res.redirect('http://localhost:5173');
});

app.listen(config.port, () => logger.info(`S.T.I.P.S API on http://localhost:${config.port}`));
