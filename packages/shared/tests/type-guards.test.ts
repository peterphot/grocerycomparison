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
    productUrl: 'https://www.woolworths.com.au/shop/search/products?searchTerm=Woolworths%20Full%20Cream%20Milk',
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

function validComparisonResponse(): ComparisonResponse {
  return {
    storeTotals: [validStoreTotal()],
    mixAndMatch: validMixAndMatch(),
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

  it('returns false when name is empty string', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), name: '' })).toBe(false);
  });

  it('returns false when name is whitespace only', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), name: '   ' })).toBe(false);
  });

  it('returns false when name exceeds 200 characters', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), name: 'a'.repeat(201) })).toBe(false);
  });

  it('accepts name at exactly 200 characters', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), name: 'a'.repeat(200) })).toBe(true);
  });

  it('returns false when quantity is zero', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), quantity: 0 })).toBe(false);
  });

  it('returns false when quantity is negative', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), quantity: -1 })).toBe(false);
  });

  it('returns false when quantity exceeds 999', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), quantity: 1000 })).toBe(false);
  });

  it('returns false when quantity is Infinity', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), quantity: Infinity })).toBe(false);
  });

  it('returns false when quantity is NaN', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), quantity: NaN })).toBe(false);
  });

  it('returns false when quantity is a decimal', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), quantity: 1.5 })).toBe(false);
  });

  it('accepts quantity at boundary values (1 and 999)', () => {
    expect(isShoppingListItem({ ...validShoppingListItem(), quantity: 1 })).toBe(true);
    expect(isShoppingListItem({ ...validShoppingListItem(), quantity: 999 })).toBe(true);
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

  it('returns true when productUrl is null', () => {
    const match = { ...validProductMatch(), productUrl: null };
    expect(isProductMatch(match)).toBe(true);
  });

  it('returns true when productUrl is a string', () => {
    const match = { ...validProductMatch(), productUrl: 'https://example.com/product' };
    expect(isProductMatch(match)).toBe(true);
  });

  it('returns false when productUrl has wrong type', () => {
    const match = { ...validProductMatch(), productUrl: 123 };
    expect(isProductMatch(match)).toBe(false);
  });

  it('returns false when productUrl is undefined (missing)', () => {
    const match = { ...validProductMatch() } as Record<string, unknown>;
    delete match.productUrl;
    expect(isProductMatch(match)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isComparisonResponse
// ---------------------------------------------------------------------------

describe('isComparisonResponse', () => {
  it('returns true for a valid ComparisonResponse', () => {
    expect(isComparisonResponse(validComparisonResponse())).toBe(true);
  });

  it('returns true for empty arrays in storeTotals', () => {
    const response: ComparisonResponse = {
      storeTotals: [],
      mixAndMatch: { items: [], total: 0 },
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

  it('returns false when storeTotals is not an array', () => {
    expect(isComparisonResponse({ ...validComparisonResponse(), storeTotals: 'not array' })).toBe(false);
  });

  it('returns false when mixAndMatch is not an object', () => {
    expect(isComparisonResponse({ ...validComparisonResponse(), mixAndMatch: 'not object' })).toBe(false);
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
