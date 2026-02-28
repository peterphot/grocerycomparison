# T006 — Aldi Adapter

## Status
- [x] Backlog
- [ ] In Progress
- [ ] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T003
- **Blocks**: T009
- **Parallel with**: T004, T005, T007, T008

---

## Summary

Implement the Aldi store adapter. The Aldi API returns prices in cents and does not pre-compute
unit prices, so the adapter must parse `sellingSize` and compute unit pricing itself.

## Source
- `plan.md` → T008, T012, Section 2.3 (Aldi API)

---

## Acceptance Criteria

- [ ] `AldiAdapter` implements `StoreAdapter` interface
- [ ] Calls `GET https://api.aldi.com.au/v3/product-search?q={query}&serviceType=walk-in`
- [ ] Sets required headers: `User-Agent`, `Origin: https://www.aldi.com.au`, `Referer: https://www.aldi.com.au/`
- [ ] Converts `price.amount` from cents to dollars (divide by 100)
- [ ] Filters out products where `notForSale === true`
- [ ] Maps each result to `ProductMatch`:
  - `store: "aldi"`
  - `productName` ← `name`
  - `brand` ← `brandName`
  - `price` ← `price.amount / 100`
  - `packageSize` ← `sellingSize` (may be null)
  - `unitPrice` + `unitMeasure` ← computed via `computeDisplayUnitPrice` from `sellingSize`
  - `unitPriceNormalised` ← computed via `computeNormalisedUnitPrice`
  - `available` ← `!notForSale`
- [ ] Sets `unitPrice`, `unitMeasure`, `unitPriceNormalised` to `null` when `sellingSize` is `null` or unparseable
- [ ] Returns `StoreApiError` on timeout or non-2xx

---

## TDD Requirements

- [ ] Create fixture `backend/tests/fixtures/aldi-milk.json` from plan Appendix A (include valid and `notForSale` examples)
- [ ] Write tests against fixture before writing adapter
- [ ] Explicitly test the cents-to-dollars conversion
- [ ] Explicitly test `notForSale` filtering
- [ ] Explicitly test null `sellingSize` handling
- [ ] All HTTP mocked with msw

---

## Test Plan

```typescript
// backend/tests/adapters/aldi.test.ts
describe('AldiAdapter', () => {
  describe('searchProduct', () => {
    it('returns ProductMatch[] from valid API response')
    it('converts price from cents to dollars')
    it('filters out products where notForSale is true')
    it('computes unitPrice and unitMeasure from sellingSize')
    it('sets unitPrice/unitMeasure/unitPriceNormalised to null when sellingSize is null')
    it('sets unitPrice/unitMeasure/unitPriceNormalised to null when sellingSize is unparseable')
    it('sends Origin and Referer headers')
    it('returns empty array when no products found')
    it('throws StoreApiError on 500')
    it('throws StoreApiError on timeout')
  })
})
```

---

## Implementation Notes

### Required headers
These must be sent on every Aldi request or the API returns 403:
```
Origin: https://www.aldi.com.au
Referer: https://www.aldi.com.au/
```
Pass as per-request header overrides to the shared HTTP client.

### Fixture design
Include at least 3 products in the fixture:
1. A valid product with a parseable `sellingSize` (e.g., `"2L"`)
2. A product with `sellingSize: null`
3. A product with `notForSale: true`

---

## Files to Create

| File | Description |
|------|-------------|
| `backend/src/adapters/aldi.ts` | Aldi adapter implementation |
| `backend/tests/adapters/aldi.test.ts` | Adapter unit tests |
| `backend/tests/fixtures/aldi-milk.json` | API response fixture |
