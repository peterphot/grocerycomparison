import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { SearchOrchestrator } from './services/search-orchestrator.js';
import { createSearchRouter } from './routes/search.js';

const app = express();

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const orchestrator = new SearchOrchestrator([]);
app.use('/api/search', createSearchRouter(orchestrator));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
