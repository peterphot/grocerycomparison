import { describe, it, expect } from 'vitest';
import {
  isShoppingListItem,
  isProductMatch,
  isComparisonResponse,
} from '../src/guards/index.js';
import type {
  ShoppingListItem,
  ProductMatch,
  ComparisonResponse,
  StoreName,
  StoreTotal,
  MixAndMatchResult,
  ItemSearchResult,
} from '../src/types/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function validShoppingListItem(): ShoppingListItem {
  return {
    id: 'item-1',
    name: 'Full Cream Milk 2L',
    quantity: 2,
    isBrandSpecific: false,
  };
}

function validProductMatch(): ProductMatch {
  return {
    store: 'woolworths',
    productName: 'Woolworths Full Cream Milk',
    brand: 'Woolworths',
    price: 3.5,
    packageSize: '2L',
    unitPrice: 1.75,
    unitMeasure: 'per litre',
    unitPriceNormalised: 0.175,
    available: true,
  };
}

function validStoreTotal(): StoreTotal {
  return {
    store: 'woolworths',
    storeName: 'Woolworths',
    items: [
      {
        shoppingListItemId: 'item-1',
        shoppingListItemName: 'Full Cream Milk 2L',
        quantity: 2,
        match: validProductMatch(),
        lineTotal: 7.0,
      },
    ],
    total: 7.0,
    unavailableCount: 0,
    allItemsAvailable: true,
  };
}

function validMixAndMatch(): MixAndMatchResult {
  return {
    items: [
      {
        shoppingListItemId: 'item-1',
        shoppingListItemName: 'Full Cream Milk 2L',
        quantity: 2,
        cheapestMatch: validProductMatch(),
        lineTotal: 7.0,
      },
    ],
    total: 7.0,
  };
}

function validItemSearchResult(): ItemSearchResult {
  return {
    shoppingListItemId: 'item-1',
    shoppingListItemName: 'Full Cream Milk 2L',
    quantity: 2,
    matches: [validProductMatch()],
  };
}

function validComparisonResponse(): ComparisonResponse {
  return {
    storeTotals: [validStoreTotal()],
    mixAndMatch: validMixAndMatch(),
    searchResults: [validItemSearchResult()],
  };
}

// ---------------------------------------------------------------------------
// isShoppingListItem
// ---------------------------------------------------------------------------

describe('isShoppingListItem', () => {
  it('returns true for a valid ShoppingListItem', () => {
    expect(isShoppingListItem(validShoppingListItem())).toBe(true);
  });

  it('returns false when id is missing', () => {
    const item = { ...validShoppingListItem() } as Record<string, unknown>;
    delete item.id;
    expect(isShoppingListItem(item)).toBe(false);
  });

  it('returns false when name is missing', () => {
    const item = { ...validShoppingListItem() } as Record<string, unknown>;
    delete item.name;
    expect(isShoppingListItem(item)).toBe(false);
  });

  it('returns false when quantity is missing', () => {
    const item = { ...validShoppingListItem() } as Record<string, unknown>;
    delete item.quantity;
    expect(isShoppingListItem(item)).toBe(false);
  });

  it('returns false when isBrandSpecific is missing', () => {
    const item = { ...validShoppingListItem() } as Record<string, unknown>;
    delete item.isBrandSpecific;
    expect(isShoppingListItem(item)).toBe(false);
  });

  it('returns false when id has wrong type', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), id: 123 })).toBe(false);
  });

  it('returns false when name has wrong type', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), name: true })).toBe(false);
  });

  it('returns false when quantity has wrong type', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), quantity: '2' })).toBe(false);
  });

  it('returns false when isBrandSpecific has wrong type', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), isBrandSpecific: 'yes' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isShoppingListItem(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isShoppingListItem(undefined)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isShoppingListItem('not an item')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isShoppingListItem(42)).toBe(false);
  });

  it('returns false for an empty object', () => {
    expect(isShoppingListItem({})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isProductMatch
// ---------------------------------------------------------------------------

describe('isProductMatch', () => {
  it('returns true for a valid ProductMatch', () => {
    expect(isProductMatch(validProductMatch())).toBe(true);
  });

  it('returns true when nullable fields are null', () => {
    const match = {
      ...validProductMatch(),
      unitPrice: null,
      unitMeasure: null,
      unitPriceNormalised: null,
    };
    expect(isProductMatch(match)).toBe(true);
  });

  it('returns false when store is missing', () => {
    const match = { ...validProductMatch() } as Record<string, unknown>;
    delete match.store;
    expect(isProductMatch(match)).toBe(false);
  });

  it('returns false when productName is missing', () => {
    const match = { ...validProductMatch() } as Record<string, unknown>;
    delete match.productName;
    expect(isProductMatch(match)).toBe(false);
  });

  it('returns false when brand is missing', () => {
    const match = { ...validProductMatch() } as Record<string, unknown>;
    delete match.brand;
    expect(isProductMatch(match)).toBe(false);
  });

  it('returns false when price is missing', () => {
    const match = { ...validProductMatch() } as Record<string, unknown>;
    delete match.price;
    expect(isProductMatch(match)).toBe(false);
  });

  it('returns false when packageSize is missing', () => {
    const match = { ...validProductMatch() } as Record<string, unknown>;
    delete match.packageSize;
    expect(isProductMatch(match)).toBe(false);
  });

  it('returns false when available is missing', () => {
    const match = { ...validProductMatch() } as Record<string, unknown>;
    delete match.available;
    expect(isProductMatch(match)).toBe(false);
  });

  it('returns false when store has wrong type', () => {
    expect(isProductMatch({ ...validProductMatch(), store: 123 })).toBe(false);
  });

  it('returns false when price has wrong type', () => {
    expect(isProductMatch({ ...validProductMatch(), price: '3.50' })).toBe(false);
  });

  it('returns false when available has wrong type', () => {
    expect(isProductMatch({ ...validProductMatch(), available: 'true' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isProductMatch(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isProductMatch(undefined)).toBe(false);
  });

  it('returns false for an empty object', () => {
    expect(isProductMatch({})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isComparisonResponse
// ---------------------------------------------------------------------------

describe('isComparisonResponse', () => {
  it('returns true for a valid ComparisonResponse', () => {
    expect(isComparisonResponse(validComparisonResponse())).toBe(true);
  });

  it('returns true for empty arrays in storeTotals and searchResults', () => {
    const response: ComparisonResponse = {
      storeTotals: [],
      mixAndMatch: { items: [], total: 0 },
      searchResults: [],
    };
    expect(isComparisonResponse(response)).toBe(true);
  });

  it('returns false when storeTotals is missing', () => {
    const response = { ...validComparisonResponse() } as Record<string, unknown>;
    delete response.storeTotals;
    expect(isComparisonResponse(response)).toBe(false);
  });

  it('returns false when mixAndMatch is missing', () => {
    const response = { ...validComparisonResponse() } as Record<string, unknown>;
    delete response.mixAndMatch;
    expect(isComparisonResponse(response)).toBe(false);
  });

  it('returns false when searchResults is missing', () => {
    const response = { ...validComparisonResponse() } as Record<string, unknown>;
    delete response.searchResults;
    expect(isComparisonResponse(response)).toBe(false);
  });

  it('returns false when storeTotals is not an array', () => {
    expect(isComparisonResponse({ ...validComparisonResponse(), storeTotals: 'not array' })).toBe(false);
  });

  it('returns false when mixAndMatch is not an object', () => {
    expect(isComparisonResponse({ ...validComparisonResponse(), mixAndMatch: 'not object' })).toBe(false);
  });

  it('returns false when searchResults is not an array', () => {
    expect(isComparisonResponse({ ...validComparisonResponse(), searchResults: 42 })).toBe(false);
  });

  it('returns false when mixAndMatch.items is missing', () => {
    const response = {
      ...validComparisonResponse(),
      mixAndMatch: { total: 0 },
    };
    expect(isComparisonResponse(response)).toBe(false);
  });

  it('returns false when mixAndMatch.total is missing', () => {
    const response = {
      ...validComparisonResponse(),
      mixAndMatch: { items: [] },
    };
    expect(isComparisonResponse(response)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isComparisonResponse(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isComparisonResponse(undefined)).toBe(false);
  });

  it('returns false for an empty object', () => {
    expect(isComparisonResponse({})).toBe(false);
  });
});
