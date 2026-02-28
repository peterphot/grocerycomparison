import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { SearchOrchestrator } from './services/search-orchestrator.js';
import { createSearchRouter } from './routes/search.js';

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_ORIGIN }));
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
