import { describe, it, expect } from 'vitest';
import { buildStoreTotals, buildMixAndMatch, buildComparisonResponse } from '../../src/services/result-builder.js';
import { makeMatch, makeSearchResult } from '../helpers/data-builders.js';

describe('buildStoreTotals', () => {
  it('calculates total as sum of price x quantity per store', () => {
    const results = [
      makeSearchResult({
        shoppingListItemId: 'item-1',
        shoppingListItemName: 'milk',
        quantity: 1,
        matches: [
          makeMatch({ store: 'woolworths', price: 3.00 }),
          makeMatch({ store: 'coles', price: 3.50 }),
        ],
      }),
      makeSearchResult({
        shoppingListItemId: 'item-2',
        shoppingListItemName: 'bread',
        quantity: 1,
        matches: [
          makeMatch({ store: 'woolworths', price: 2.00 }),
          makeMatch({ store: 'coles', price: 2.50 }),
        ],
      }),
    ];

    const totals = buildStoreTotals(results);
    const woolworths = totals.find((t) => t.store === 'woolworths')!;
    const coles = totals.find((t) => t.store === 'coles')!;

    expect(woolworths.total).toBe(5.00);
    expect(coles.total).toBe(6.00);
  });

  it('returns stores in fixed order: woolworths, coles, aldi, harrisfarm', () => {
    const results = [
      makeSearchResult({
        matches: [
          makeMatch({ store: 'woolworths', price: 10.00 }),
          makeMatch({ store: 'coles', price: 3.00 }),
          makeMatch({ store: 'aldi', price: 5.00 }),
          makeMatch({ store: 'harrisfarm', price: 7.00 }),
        ],
      }),
    ];

    const totals = buildStoreTotals(results);
    expect(totals[0].store).toBe('woolworths');
    expect(totals[1].store).toBe('coles');
    expect(totals[2].store).toBe('aldi');
    expect(totals[3].store).toBe('harrisfarm');
  });

  it('counts unavailable items per store', () => {
    const results = [
      makeSearchResult({
        shoppingListItemId: 'item-1',
        matches: [
          makeMatch({ store: 'woolworths', price: 3.00 }),
        ],
      }),
      makeSearchResult({
        shoppingListItemId: 'item-2',
        matches: [
          makeMatch({ store: 'woolworths', price: 2.00 }),
        ],
      }),
    ];

    const totals = buildStoreTotals(results);
    const coles = totals.find((t) => t.store === 'coles')!;

    expect(coles.unavailableCount).toBe(2);
  });

  it('sets allItemsAvailable false when any item is missing', () => {
    const results = [
      makeSearchResult({
        shoppingListItemId: 'item-1',
        matches: [
          makeMatch({ store: 'woolworths', price: 3.00 }),
          makeMatch({ store: 'coles', price: 3.50 }),
        ],
      }),
      makeSearchResult({
        shoppingListItemId: 'item-2',
        matches: [
          makeMatch({ store: 'woolworths', price: 2.00 }),
          // coles has no match for item-2
        ],
      }),
    ];

    const totals = buildStoreTotals(results);
    const woolworths = totals.find((t) => t.store === 'woolworths')!;
    const coles = totals.find((t) => t.store === 'coles')!;

    expect(woolworths.allItemsAvailable).toBe(true);
    expect(coles.allItemsAvailable).toBe(false);
  });

  it('handles quantity > 1 correctly (3x $2.00 = $6.00)', () => {
    const results = [
      makeSearchResult({
        quantity: 3,
        matches: [
          makeMatch({ store: 'woolworths', price: 2.00 }),
        ],
      }),
    ];

    const totals = buildStoreTotals(results);
    const woolworths = totals.find((t) => t.store === 'woolworths')!;

    expect(woolworths.total).toBe(6.00);
  });

  it('treats matches with available: false as unavailable', () => {
    const results = [
      makeSearchResult({
        matches: [
          makeMatch({ store: 'woolworths', price: 3.00, available: true }),
          makeMatch({ store: 'woolworths', price: 5.00, available: false }),
          makeMatch({ store: 'coles', price: 4.00, available: false }),
        ],
      }),
    ];

    const totals = buildStoreTotals(results);
    const woolworths = totals.find((t) => t.store === 'woolworths')!;
    const coles = totals.find((t) => t.store === 'coles')!;

    expect(woolworths.items[0].match!.price).toBe(3.00);
    expect(woolworths.allItemsAvailable).toBe(true);
    expect(coles.items[0].match).toBeNull();
    expect(coles.allItemsAvailable).toBe(false);
  });

  it('picks cheapest available match when store has multiple matches', () => {
    const results = [
      makeSearchResult({
        matches: [
          makeMatch({ store: 'woolworths', price: 5.00 }),
          makeMatch({ store: 'woolworths', price: 2.00 }),
          makeMatch({ store: 'woolworths', price: 8.00 }),
        ],
      }),
    ];

    const totals = buildStoreTotals(results);
    const woolworths = totals.find((t) => t.store === 'woolworths')!;

    expect(woolworths.items[0].match!.price).toBe(2.00);
    expect(woolworths.total).toBe(2.00);
  });

  it('maintains fixed order even when some stores have no results', () => {
    const results = [
      makeSearchResult({
        matches: [
          makeMatch({ store: 'coles', price: 10.00 }),
          makeMatch({ store: 'aldi', price: 5.00 }),
          // woolworths and harrisfarm have no matches
        ],
      }),
    ];

    const totals = buildStoreTotals(results);
    // Fixed order is always woolworths, coles, aldi, harrisfarm
    expect(totals[0].store).toBe('woolworths');
    expect(totals[1].store).toBe('coles');
    expect(totals[2].store).toBe('aldi');
    expect(totals[3].store).toBe('harrisfarm');
    // woolworths and harrisfarm have no matches
    expect(totals[0].total).toBe(0);
    expect(totals[3].total).toBe(0);
  });
});

describe('buildMixAndMatch', () => {
  it('selects cheapest match per item across all stores', () => {
    const results = [
      makeSearchResult({
        matches: [
          makeMatch({ store: 'woolworths', price: 5.00, unitPriceNormalised: null }),
          makeMatch({ store: 'coles', price: 3.00, unitPriceNormalised: null }),
          makeMatch({ store: 'aldi', price: 4.00, unitPriceNormalised: null }),
        ],
      }),
    ];

    const mix = buildMixAndMatch(results);
    expect(mix.items[0].cheapestMatch!.store).toBe('coles');
    expect(mix.items[0].lineTotal).toBe(3.00);
    expect(mix.total).toBe(3.00);
  });

  it('always uses absolute price for comparison (ignores unitPriceNormalised)', () => {
    const results = [
      makeSearchResult({
        matches: [
          makeMatch({ store: 'woolworths', price: 6.00, unitPriceNormalised: 0.30 }),
          makeMatch({ store: 'coles', price: 3.00, unitPriceNormalised: 0.60 }),
        ],
      }),
    ];

    const mix = buildMixAndMatch(results);
    // Coles has lower absolute price ($3 vs $6), so it should be chosen
    // even though woolworths has better unit price
    expect(mix.items[0].cheapestMatch!.store).toBe('coles');
    expect(mix.items[0].lineTotal).toBe(3.00);
  });

  it('ignores matches with available: false', () => {
    const results = [
      makeSearchResult({
        matches: [
          makeMatch({ store: 'woolworths', price: 1.00, available: false, unitPriceNormalised: null }),
          makeMatch({ store: 'coles', price: 5.00, available: true, unitPriceNormalised: null }),
        ],
      }),
    ];

    const mix = buildMixAndMatch(results);
    expect(mix.items[0].cheapestMatch!.store).toBe('coles');
    expect(mix.items[0].lineTotal).toBe(5.00);
  });

  it('sets cheapestMatch to null when no store has the item', () => {
    const results = [
      makeSearchResult({
        matches: [],
      }),
    ];

    const mix = buildMixAndMatch(results);
    expect(mix.items[0].cheapestMatch).toBeNull();
    expect(mix.items[0].lineTotal).toBe(0);
    expect(mix.total).toBe(0);
  });

  it('total equals sum of cheapest x quantities', () => {
    const results = [
      makeSearchResult({
        shoppingListItemId: 'item-1',
        quantity: 2,
        matches: [
          makeMatch({ store: 'woolworths', price: 3.00, unitPriceNormalised: null }),
          makeMatch({ store: 'coles', price: 4.00, unitPriceNormalised: null }),
        ],
      }),
      makeSearchResult({
        shoppingListItemId: 'item-2',
        quantity: 3,
        matches: [
          makeMatch({ store: 'aldi', price: 2.00, unitPriceNormalised: null }),
          makeMatch({ store: 'coles', price: 1.50, unitPriceNormalised: null }),
        ],
      }),
    ];

    const mix = buildMixAndMatch(results);
    // item-1: woolworths $3 x 2 = $6, item-2: coles $1.50 x 3 = $4.50
    expect(mix.items[0].cheapestMatch!.store).toBe('woolworths');
    expect(mix.items[0].lineTotal).toBe(6.00);
    expect(mix.items[1].cheapestMatch!.store).toBe('coles');
    expect(mix.items[1].lineTotal).toBe(4.50);
    expect(mix.total).toBe(10.50);
  });
});

describe('buildComparisonResponse', () => {
  it('assembles storeTotals and mixAndMatch', () => {
    const results = [
      makeSearchResult({
        matches: [
          makeMatch({ store: 'woolworths', price: 5.00 }),
        ],
      }),
    ];

    const response = buildComparisonResponse(results);
    expect(response).toHaveProperty('storeTotals');
    expect(response).toHaveProperty('mixAndMatch');
    expect(response.storeTotals).toBeInstanceOf(Array);
    expect(response.mixAndMatch).toHaveProperty('items');
    expect(response.mixAndMatch).toHaveProperty('total');
  });

  it('storeTotals are in fixed order regardless of price', () => {
    const results = [
      makeSearchResult({
        matches: [
          makeMatch({ store: 'woolworths', price: 10.00 }),
          makeMatch({ store: 'coles', price: 3.00 }),
          makeMatch({ store: 'aldi', price: 7.00 }),
        ],
      }),
    ];

    const response = buildComparisonResponse(results);
    expect(response.storeTotals[0].store).toBe('woolworths');
    expect(response.storeTotals[1].store).toBe('coles');
    expect(response.storeTotals[2].store).toBe('aldi');
    expect(response.storeTotals[3].store).toBe('harrisfarm');
  });
});
