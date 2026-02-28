import express from 'express';
import cors from 'cors';

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_ORIGIN }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
