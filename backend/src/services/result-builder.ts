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
import { ALL_STORES, STORE_DISPLAY_NAMES } from '@grocery/shared';

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function cheapestAvailableMatch(
  matches: ProductMatch[],
  store: StoreName,
): ProductMatch | null {
  const storeMatches = matches.filter((m) => m.store === store && m.available);
  if (storeMatches.length === 0) return null;
  return storeMatches.reduce((best, curr) => (curr.price < best.price ? curr : best));
}

export function buildStoreTotals(results: ItemSearchResult[]): StoreTotal[] {
  const totals = ALL_STORES.map((store) => {
    const items: StoreItemResult[] = results.map((result) => {
      const match = cheapestAvailableMatch(result.matches, store);
      const lineTotal = match ? roundCents(match.price * result.quantity) : 0;
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
      total: roundCents(total),
      unavailableCount,
      allItemsAvailable: unavailableCount === 0,
    };
  });

  // Fixed store order matching the design: woolworths, coles, aldi, harrisfarm
  return totals;
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
    // Always compare by absolute price (same metric as store columns)
    // so Mix & Match total represents the lowest possible spend.
    const cheapest = availableMatches.reduce((best, curr) =>
      curr.price < best.price ? curr : best,
    );
    return {
      shoppingListItemId: result.shoppingListItemId,
      shoppingListItemName: result.shoppingListItemName,
      quantity: result.quantity,
      cheapestMatch: cheapest,
      lineTotal: roundCents(cheapest.price * result.quantity),
    };
  });
  const total = roundCents(items.reduce((sum, item) => sum + item.lineTotal, 0));
  return { items, total };
}

export function buildComparisonResponse(results: ItemSearchResult[]): ComparisonResponse {
  return {
    storeTotals: buildStoreTotals(results),
    mixAndMatch: buildMixAndMatch(results),
  };
}
