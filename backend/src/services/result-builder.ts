import type {
  StoreName,
  ProductMatch,
  ItemSearchResult,
  StoreTotal,
  StoreItemResult,
  MixAndMatchResult,
  MixAndMatchItem,
  ComparisonResponse,
} from '@grocery/shared';

const ALL_STORES: StoreName[] = ['woolworths', 'coles', 'aldi', 'harrisfarm'];

const STORE_DISPLAY_NAMES: Record<StoreName, string> = {
  woolworths: 'Woolworths',
  coles: 'Coles',
  aldi: 'Aldi',
  harrisfarm: 'Harris Farm',
};

export function buildStoreTotals(results: ItemSearchResult[]): StoreTotal[] {
  const totals = ALL_STORES.map((store) => {
    const items: StoreItemResult[] = results.map((result) => {
      const match = result.matches.find((m) => m.store === store && m.available) || null;
      const lineTotal = match ? match.price * result.quantity : 0;
      return {
        shoppingListItemId: result.shoppingListItemId,
        shoppingListItemName: result.shoppingListItemName,
        quantity: result.quantity,
        match,
        lineTotal,
      };
    });
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const unavailableCount = items.filter((item) => item.match === null).length;
    return {
      store,
      storeName: STORE_DISPLAY_NAMES[store],
      items,
      total: Math.round(total * 100) / 100,
      unavailableCount,
      allItemsAvailable: unavailableCount === 0,
    };
  });

  return totals.sort((a, b) => {
    if (!a.allItemsAvailable && a.total === 0 && b.total > 0) return 1;
    if (!b.allItemsAvailable && b.total === 0 && a.total > 0) return -1;
    return a.total - b.total;
  });
}

export function buildMixAndMatch(results: ItemSearchResult[]): MixAndMatchResult {
  const items: MixAndMatchItem[] = results.map((result) => {
    const availableMatches = result.matches.filter((m) => m.available);
    if (availableMatches.length === 0) {
      return {
        shoppingListItemId: result.shoppingListItemId,
        shoppingListItemName: result.shoppingListItemName,
        quantity: result.quantity,
        cheapestMatch: null,
        lineTotal: 0,
      };
    }
    const hasNormalised = availableMatches.some((m) => m.unitPriceNormalised !== null);
    const cheapest = availableMatches.reduce((best, curr) => {
      if (hasNormalised) {
        const bestVal = best.unitPriceNormalised ?? Infinity;
        const currVal = curr.unitPriceNormalised ?? Infinity;
        return currVal < bestVal ? curr : best;
      }
      return curr.price < best.price ? curr : best;
    });
    return {
      shoppingListItemId: result.shoppingListItemId,
      shoppingListItemName: result.shoppingListItemName,
      quantity: result.quantity,
      cheapestMatch: cheapest,
      lineTotal: Math.round(cheapest.price * result.quantity * 100) / 100,
    };
  });
  const total = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  return { items, total };
}

export function buildComparisonResponse(results: ItemSearchResult[]): ComparisonResponse {
  return {
    storeTotals: buildStoreTotals(results),
    mixAndMatch: buildMixAndMatch(results),
    searchResults: results,
  };
}
