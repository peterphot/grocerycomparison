import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { SearchOrchestrator } from './services/search-orchestrator.js';
import { createSearchRouter } from './routes/search.js';
import { WoolworthsAdapter } from './adapters/woolworths.js';
import { ColesAdapter } from './adapters/coles.js';
import { AldiAdapter } from './adapters/aldi.js';
import { HarrisFarmAdapter } from './adapters/harris-farm.js';
import { ColesSessionManager } from './utils/coles-session.js';

const app = express();

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const adapters = [
  new WoolworthsAdapter(),
  new ColesAdapter(new ColesSessionManager()),
  new AldiAdapter(),
  new HarrisFarmAdapter(),
];
const orchestrator = new SearchOrchestrator(adapters);
app.use('/api/search', createSearchRouter(orchestrator));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
