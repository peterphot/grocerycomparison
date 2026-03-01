import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { SearchOrchestrator } from './services/search-orchestrator.js';
import { createSearchRouter } from './routes/search.js';
import { WoolworthsAdapter } from './adapters/woolworths.js';
import { ColesAdapter } from './adapters/coles.js';
import { AldiAdapter } from './adapters/aldi.js';
import { HarrisFarmAdapter } from './adapters/harris-farm.js';
import { ColesSessionManager } from './utils/coles-session.js';

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());

const searchRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

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
app.use('/api/search', searchRateLimiter, createSearchRouter(orchestrator));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
