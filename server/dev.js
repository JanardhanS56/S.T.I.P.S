// Local development server: node --env-file=.env server/dev.js
import app from './app.js';
import { config } from './config.js';

app.get('/', (_req, res) => {
  res.redirect('http://localhost:5173');
});

app.listen(config.port, () => console.log(`S.T.I.P.S API on http://localhost:${config.port}`));
