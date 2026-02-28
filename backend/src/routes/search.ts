import { Router } from 'express';
import { isShoppingListItem } from '@grocery/shared';
import { SearchOrchestrator } from '../services/search-orchestrator.js';
import { config } from '../config.js';

export function createSearchRouter(orchestrator: SearchOrchestrator): Router {
  const router = Router();

  router.post('/', async (req, res, next) => {
    try {
      const { items } = req.body ?? {};

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'items must be a non-empty array' });
        return;
      }

      if (items.length > config.maxItems) {
        res.status(400).json({ error: `Too many items (max ${config.maxItems})` });
        return;
      }

      for (let i = 0; i < items.length; i++) {
        if (!isShoppingListItem(items[i])) {
          res.status(400).json({ error: `Invalid item at index ${i}` });
          return;
        }
      }

      const result = await orchestrator.search(items);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
