# T005 — Coles Adapter

## Status
- [x] Backlog
- [x] In Progress
- [x] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T003
- **Blocks**: T009
- **Parallel with**: T004, T006, T007, T008

---

## Summary

Implement the Coles adapter including the session manager that handles buildId extraction and
cookie caching. The Coles approach uses the Next.js SSR data endpoint, which requires session
management to work around Imperva bot protection.

## Source
- `plan.md` → T007, T011, Section 2.2 (Coles API), Section 5.5 (Coles Session Manager)

---

## Acceptance Criteria

### ColesSessionManager
- [ ] On first call, fetches `https://www.coles.com.au/` and extracts `buildId` from `__NEXT_DATA__` script tag
- [ ] Stores session cookies returned by the homepage fetch
- [ ] Returns cached `{ cookies, buildId }` for subsequent calls within TTL (5 minutes)
- [ ] Automatically refreshes session when TTL expires
- [ ] On stale buildId (404 from data route), clears cache and refreshes session once, then retries
- [ ] Thread-safe: concurrent calls during refresh do not trigger multiple simultaneous refreshes

### ColesAdapter
- [ ] Implements `StoreAdapter` interface
- [ ] Calls `GET https://www.coles.com.au/_next/data/{buildId}/search/products.json?q={query}`
- [ ] Passes session cookies in `Cookie` header
- [ ] Parses `pageProps.searchResults.results` filtering to `_type === "PRODUCT"`
- [ ] Maps each result to `ProductMatch`:
  - `store: "coles"`
  - `productName` ← `name`
  - `brand` ← `brand`
  - `price` ← `pricing.now` (dollars)
  - `packageSize` ← `size`
  - `unitPrice` ← `pricing.unit.price`
  - `unitMeasure` ← `pricing.unit.ofMeasureUnits` (e.g., `"l"` → `"L"`)
  - `unitPriceNormalised` ← computed via `computeNormalisedUnitPrice`
  - `available` ← `availability`
- [ ] Filters out products where `availability === false`
- [ ] Returns `StoreApiError` on unrecoverable error (after retry)

---

## TDD Requirements

- [ ] Create fixture files for both homepage HTML (with `__NEXT_DATA__`) and search JSON response
- [ ] Test session manager in isolation with mocked HTTP responses
- [ ] Test adapter with mocked session manager + mocked search response
- [ ] Test stale buildId flow: mock a 404, then mock session refresh, then mock successful retry
- [ ] All HTTP calls mocked with msw

---

## Test Plan

```typescript
// backend/tests/adapters/coles-session.test.ts
describe('ColesSessionManager', () => {
  it('extracts buildId from __NEXT_DATA__ script tag')
  it('caches session within TTL')
  it('refreshes after TTL expires')
  it('handles concurrent calls during refresh — only one fetch fires')
  it('clears and refreshes on stale buildId (404)')
})

// backend/tests/adapters/coles.test.ts
describe('ColesAdapter', () => {
  describe('searchProduct', () => {
    it('returns ProductMatch[] from valid SSR response')
    it('filters out non-PRODUCT types from results')
    it('maps pricing.unit fields to unitPrice/unitMeasure')
    it('normalises unitMeasure casing ("l" → "L")')
    it('computes unitPriceNormalised')
    it('filters out unavailable products')
    it('retries with fresh session on 404 buildId error')
    it('throws StoreApiError after exhausting retries')
  })
})
```

---

## Implementation Notes

### buildId extraction
```typescript
const match = html.match(/"buildId":"([^"]+)"/);
const buildId = match?.[1];
```

### Refresh lock
Use a promise-based lock to prevent thundering herd during session refresh:
```typescript
private refreshPromise: Promise<void> | null = null;

async ensureSession() {
  if (!this.refreshPromise && this.isExpired()) {
    this.refreshPromise = this.refresh().finally(() => this.refreshPromise = null);
  }
  await this.refreshPromise;
  return { cookies: this.cookies!, buildId: this.buildId! };
}
```

### ofMeasureUnits normalisation
Coles returns lowercase `"l"` — normalise to `"L"` for consistency with other stores.

---

## Files to Create

| File | Description |
|------|-------------|
| `backend/src/utils/coles-session.ts` | `ColesSessionManager` class |
| `backend/src/adapters/coles.ts` | Coles adapter implementation |
| `backend/tests/adapters/coles.test.ts` | Adapter + session tests |
| `backend/tests/adapters/coles-session.test.ts` | Session manager tests |
| `backend/tests/fixtures/coles-homepage.html` | Minimal HTML with `__NEXT_DATA__` |
| `backend/tests/fixtures/coles-milk.json` | Search results fixture |
