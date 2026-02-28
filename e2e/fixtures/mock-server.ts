import express from 'express';
import cors from 'cors';
import { defaultResponse, buildQuantityResponse } from './comparison-response.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/search', (req, res) => {
  const items = req.body?.items;

  // If only one item is sent, return the quantity-aware response
  if (Array.isArray(items) && items.length === 1) {
    const quantity = items[0]?.quantity ?? 1;
    res.json(buildQuantityResponse(quantity));
    return;
  }

  // Default: return the full comparison response
  res.json(defaultResponse);
});

const PORT = parseInt(process.env.MOCK_PORT ?? '4000', 10);

app.listen(PORT, () => {
  console.log(`Mock server listening on port ${PORT}`);
});
