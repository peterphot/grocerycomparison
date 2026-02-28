# T008 — Result Builder (Comparison Logic)

## Status
- [ ] Backlog
- [ ] In Progress
- [x] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T002 (only needs types, not adapters)
- **Blocks**: T009
- **Parallel with**: T003, T004, T005, T006, T007, T011

---

## Summary

Implement the pure comparison logic: given raw search results from all stores, compute per-store
totals, identify the cheapest store, and determine the optimal mix-and-match basket.
This is pure business logic with no HTTP — ideal for TDD in isolation.

## Source
- `plan.md` → T016, T017, Section 5.3 (Search Orchestrator), Section 5.4 (Matching Strategy)

---

## Acceptance Criteria

- [ ] `buildStoreTotals(results: ItemSearchResult[]): StoreTotal[]` computes per-store totals correctly
- [ ] Store totals are sorted ascending by `total` (cheapest first)
- [ ] `total` is the sum of `(price × quantity)` for all available items
- [ ] `unavailableCount` counts items with no match at that store
- [ ] `allItemsAvailable` is `true` only when every item has a match
- [ ] `buildMixAndMatch(results: ItemSearchResult[]): MixAndMatchResult` selects cheapest match per item across all stores
- [ ] Mix-and-match uses `unitPriceNormalised` for comparison when available, falls back to `price` otherwise
- [ ] Items with no match at any store have `cheapestMatch: null` in mix-and-match
- [ ] `buildComparisonResponse` assembles the full `ComparisonResponse`
- [ ] A store with 0 total (all items unavailable) is sorted last

---

## TDD Requirements

- [ ] This is pure logic — no mocks needed, just data fixtures
- [ ] Create test data builder helpers for `ProductMatch` and `ItemSearchResult`
- [ ] Test edge cases: all stores unavailable, one store missing, quantity > 1
- [ ] All tests written before any implementation

---

## Test Plan

```typescript
// backend/tests/services/result-builder.test.ts

// Test helpers
const makeMatch = (store: StoreName, price: number, unitPriceNormalised?: number): ProductMatch

describe('buildStoreTotals', () => {
  it('calculates total as sum of price × quantity per store')
  it('sorts stores ascending by total (cheapest first)')
  it('counts unavailable items per store')
  it('sets allItemsAvailable false when any item is missing')
  it('returns 4 store entries even when one store has no results')
  it('handles quantity > 1 correctly (3× $2.00 = $6.00 line total)')
})

describe('buildMixAndMatch', () => {
  it('selects the cheapest match per item across all stores')
  it('uses unitPriceNormalised for comparison when available')
  it('falls back to price comparison when unitPriceNormalised is null')
  it('sets cheapestMatch to null when no store has the item')
  it('mix total equals sum of cheapest matches × quantities')
})

describe('buildComparisonResponse', () => {
  it('assembles storeTotals, mixAndMatch, and searchResults')
  it('storeTotals are sorted cheapest first')
})
```

---

## Implementation Notes

### Cheapest match selection strategy
For brand-agnostic items: use `unitPriceNormalised` for fair comparison across pack sizes.
If `unitPriceNormalised` is null for all matches (e.g., count-based items), fall back to raw `price`.

### Store total when items unavailable
An unavailable item contributes `$0.00` to the total but increments `unavailableCount`.
The total only reflects available items to avoid misleading low totals.

### Test data builders
```typescript
// Keep tests readable with factory functions:
const makeItem = (overrides?: Partial<ShoppingListItem>): ShoppingListItem => ({
  id: 'item-1', name: 'milk 2L', quantity: 1, isBrandSpecific: false, ...overrides
});
```

---

## Files to Create

| File | Description |
|------|-------------|
| `backend/src/services/result-builder.ts` | `buildStoreTotals`, `buildMixAndMatch`, `buildComparisonResponse` |
| `backend/tests/services/result-builder.test.ts` | Comparison logic tests |
| `backend/tests/helpers/data-builders.ts` | Test data factory functions |
