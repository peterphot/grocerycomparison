import express from 'express';
import cors from 'cors';
import { isShoppingListItem } from '@grocery/shared';
import { defaultResponse, buildQuantityResponse } from './comparison-response';
import { MOCK_PORT } from '../e2e.config';

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Mock response contract:
// - 1 item  -> quantity-aware milk-only response (buildQuantityResponse)
// - 2+ items -> defaultResponse (milk + bread, Aldi bread unavailable)
// Add new response branches if tests need different fixtures.
app.post('/api/search', (req, res) => {
  const items = req.body?.items;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'items must be a non-empty array' });
    return;
  }

  for (let i = 0; i < items.length; i++) {
    if (!isShoppingListItem(items[i])) {
      res.status(400).json({ error: `Invalid item at index ${i}` });
      return;
    }
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

const PORT = parseInt(process.env.MOCK_PORT ?? String(MOCK_PORT), 10);

app.listen(PORT, () => {
  console.log(`Mock server listening on port ${PORT}`);
});
