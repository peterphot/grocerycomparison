# T004 — Woolworths Adapter

## Status
- [x] Backlog
- [x] In Progress
- [x] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T003
- **Blocks**: T009
- **Parallel with**: T005, T006, T007, T008

---

## Summary

Implement the Woolworths store adapter: parse the direct REST API response and return normalised
`ProductMatch[]`. The API is confirmed working with a spoofed User-Agent.

## Source
- `plan.md` → T006, T010, Section 2.1 (Woolworths API)

---

## Acceptance Criteria

- [ ] `WoolworthsAdapter` implements `StoreAdapter` interface
- [ ] Calls `GET https://www.woolworths.com.au/apis/ui/Search/products?searchTerm={query}&pageSize=24`
- [ ] Flattens nested `Products[].Products[]` structure correctly
- [ ] Maps each product to `ProductMatch` with correct fields:
  - `store: "woolworths"`
  - `productName` ← `DisplayName`
  - `brand` ← `Brand`
  - `price` ← `Price` (already dollars)
  - `packageSize` ← `PackageSize`
  - `unitPrice` + `unitMeasure` ← from `CupPrice` / `CupMeasure` directly (store pre-computes this)
  - `unitPriceNormalised` ← computed via `computeNormalisedUnitPrice`
  - `available` ← `IsAvailable`
- [ ] Filters out products where `IsAvailable === false`
- [ ] Returns empty array (not error) if API returns 0 results
- [ ] Returns `StoreApiError` on timeout or non-2xx response
- [ ] `isAvailable()` health check returns `true` when API is reachable

---

## TDD Requirements

- [ ] Create fixture file `backend/tests/fixtures/woolworths-milk.json` with real API response (from `plan.md` Appendix A)
- [ ] Write tests against fixture BEFORE writing adapter code
- [ ] Every mapping field must have a test asserting the correct value
- [ ] Test the flattening of nested structure explicitly
- [ ] All HTTP calls mocked with msw — no real network calls in tests

---

## Test Plan

```typescript
// backend/tests/adapters/woolworths.test.ts

describe('WoolworthsAdapter', () => {
  describe('searchProduct', () => {
    it('returns ProductMatch[] from valid API response')
    it('maps DisplayName to productName correctly')
    it('maps CupPrice/CupMeasure to unitPrice/unitMeasure')
    it('computes unitPriceNormalised from CupPrice/CupMeasure')
    it('flattens nested Products[].Products[] groups')
    it('filters out unavailable products (IsAvailable: false)')
    it('returns empty array when API returns no products')
    it('throws StoreApiError on 500 response')
    it('throws StoreApiError on timeout')
  })

  describe('isAvailable', () => {
    it('returns true when API responds')
    it('returns false when API is unreachable')
  })
})
```

---

## Implementation Notes

### Nested response flattening
```typescript
// Response: { Products: [{ Products: [product, product] }, ...] }
const flat = response.Products.flatMap(group => group.Products);
```

### CupMeasure → unitMeasure
Woolworths returns CupMeasure as display-ready strings (e.g., `"1L"`, `"100g"`).
Use these verbatim for `unitMeasure`. Parse them to compute `unitPriceNormalised`.

### Fixture location
`backend/tests/fixtures/woolworths-milk.json` — use the sample from `plan.md` Appendix A as a
starting point, but the fixture should represent the full response envelope (with the outer Products array).

---

## Files to Create

| File | Description |
|------|-------------|
| `backend/src/adapters/store-adapter.ts` | `StoreAdapter` interface (if not exists) |
| `backend/src/adapters/woolworths.ts` | Woolworths adapter implementation |
| `backend/tests/adapters/woolworths.test.ts` | Adapter unit tests |
| `backend/tests/fixtures/woolworths-milk.json` | API response fixture |
