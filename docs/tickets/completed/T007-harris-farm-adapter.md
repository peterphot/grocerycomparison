# T007 — Harris Farm Adapter

## Status
- [x] Backlog
- [x] In Progress
- [x] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T003
- **Blocks**: T009
- **Parallel with**: T004, T005, T006, T008

---

## Summary

Implement the Harris Farm adapter using the Shopify suggest API. Unit pricing must be extracted
from the product title via regex since the API does not provide a structured size field.

## Source
- `plan.md` → T009, T013, Section 2.4 (Harris Farm API)

---

## Acceptance Criteria

- [ ] `HarrisFarmAdapter` implements `StoreAdapter` interface
- [ ] Calls `GET https://www.harrisfarm.com.au/search/suggest.json?q={query}&resources[type]=product&resources[limit]=10`
- [ ] Parses `resources.results.products` array
- [ ] Converts `price` string to float (e.g., `"3.10"` → `3.10`)
- [ ] Extracts package size from `title` using regex: `\d+(\.\d+)?\s*(g|kg|ml|L)` (case-insensitive, metric only)
- [ ] Maps each result to `ProductMatch`:
  - `store: "harrisfarm"`
  - `productName` ← `title`
  - `brand` ← derived from `vendor` or extracted from title
  - `price` ← `parseFloat(price)`
  - `packageSize` ← regex-extracted from title (e.g., `"2L"`)
  - `unitPrice` + `unitMeasure` ← computed via `computeDisplayUnitPrice` from extracted size
  - `unitPriceNormalised` ← computed via `computeNormalisedUnitPrice`
  - `available` ← `available`
- [ ] Sets `unitPrice`, `unitMeasure`, `unitPriceNormalised` to `null` when size cannot be extracted from title
- [ ] Filters out products where `available === false`
- [ ] Returns `StoreApiError` on timeout or non-2xx

---

## TDD Requirements

- [ ] Create fixture `backend/tests/fixtures/harrisfarm-milk.json`
- [ ] Test title regex extraction with multiple format examples
- [ ] Test graceful null handling when regex finds no size
- [ ] Test price string parsing (including edge case: `"3.10"` with trailing zero)
- [ ] All HTTP mocked with msw

---

## Test Plan

```typescript
// backend/tests/adapters/harris-farm.test.ts
describe('HarrisFarmAdapter', () => {
  describe('searchProduct', () => {
    it('returns ProductMatch[] from Shopify suggest response')
    it('parses price string to float correctly ("3.10" → 3.10)')
    it('extracts "2L" from "Harris Farm Lite Milk 2L"')
    it('extracts "500g" from "Harris Farm Yoghurt Vanilla 500g"')
    it('sets unitPrice/unitMeasure to null when title has no size pattern')
    it('filters out unavailable products (available: false)')
    it('throws StoreApiError on 500')
  })

  describe('title size extraction', () => {
    it('handles "2L" → { quantity: 2000, unit: "ml" }')
    it('handles "500g" → { quantity: 500, unit: "g" }')
    it('handles "1.5kg" → { quantity: 1500, unit: "g" }')
    it('handles "250ml" → { quantity: 250, unit: "ml" }')
    it('returns null for "Assorted" with no size')
  })
})
```

---

## Implementation Notes

### Title regex
```typescript
const SIZE_REGEX = /(\d+(?:\.\d+)?)\s*(g|kg|ml|l)/i;
```
Apply to the full title string. Take the last match if multiple (e.g., a title with a count AND a size).

### Brand extraction
Harris Farm products use `vendor: "HFM"` for all products. Extract brand from `title` by taking
the first word(s) before the product descriptor, or default to `"Harris Farm"`.

### Fixture design
Include at least 3 products:
1. Product with size in title and `available: true`
2. Product with no discernible size in title
3. Product with `available: false`

---

## Files to Create

| File | Description |
|------|-------------|
| `backend/src/adapters/harris-farm.ts` | Harris Farm adapter implementation |
| `backend/tests/adapters/harris-farm.test.ts` | Adapter unit tests |
| `backend/tests/fixtures/harrisfarm-milk.json` | API response fixture |
