import express from 'express';
import cors from 'cors';
import { defaultResponse, buildQuantityResponse } from './comparison-response';

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/search', (req, res) => {
  const items = req.body?.items;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items must be a non-empty array' });
    return;
  }

  // Single item: return quantity-aware response
  if (items.length === 1) {
    const quantity = items[0]?.quantity ?? 1;
    res.json(buildQuantityResponse(quantity));
    return;
  }

  // Default: return the full comparison response
  res.json(defaultResponse);
});

const PORT = parseInt(process.env.MOCK_PORT ?? '4001', 10);

app.listen(PORT, () => {
  console.log(`Mock server listening on port ${PORT}`);
});
