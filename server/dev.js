// Local development server: node --env-file=.env server/dev.js
import app from './app.js';
import { config } from './config.js';

app.listen(config.port, () => console.log(`S.T.I.P.S API on http://localhost:${config.port}`));
