# T003 — Backend Utilities (HTTP Client, Rate Limiter, Unit Price)

## Status
- [x] Backlog
- [ ] In Progress
- [ ] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T002
- **Blocks**: T004, T005, T006, T007
- **Parallel with**: T008 (result builder only needs T002), T011, T012

---

## Summary

Implement the three foundational backend utilities shared by all store adapters: the HTTP client
(with correct spoofed headers), the per-store rate limiter, and the unit price calculation module
(display-contextual and normalised-for-comparison).

## Source
- `plan.md` → T004, T005, Section 3.1 (Request Headers), Section 2.5 (Summary Table)

---

## Acceptance Criteria

### HTTP Client
- [ ] Sends requests with Chrome User-Agent by default
- [ ] Accepts per-request header overrides (for Aldi Origin/Referer, Coles cookies)
- [ ] Enforces 10-second timeout per request (independent per store call, not global)
- [ ] Throws a typed `StoreApiError` on non-2xx responses
- [ ] Retries once on transient errors (5xx, network errors, AbortError) with 500ms backoff
- [ ] Does NOT retry on 4xx responses (non-retryable)
- [ ] On stale Coles buildId (404): marks error as retryable so session manager can refresh

### Rate Limiter
- [ ] Limits concurrent outbound requests per store to max 2
- [ ] Queue excess requests (do not reject them)
- [ ] Tested by verifying that a 3rd concurrent call waits for one to complete

### Unit Price — Display (contextual)
- [ ] 500g item → `{ unitPrice: X, unitMeasure: "100g" }`
- [ ] 2kg item → `{ unitPrice: X, unitMeasure: "kg" }`
- [ ] 600ml item → `{ unitPrice: X, unitMeasure: "100ml" }`
- [ ] 2L item → `{ unitPrice: X, unitMeasure: "L" }`
- [ ] Count-based → `{ unitPrice: X, unitMeasure: "each" }`
- [ ] Returns `null` for unparseable size strings

### Unit Price — Normalised (for comparison)
- [ ] Any weight item always normalises to per-100g
- [ ] Any volume item always normalises to per-100ml
- [ ] Returns `null` for count-based or unparseable units
- [ ] Weight and volume are never cross-converted

### Size String Parsing
- [ ] Parses: `"500g"`, `"2kg"`, `"1.5L"`, `"600ml"`, `"2 x 250ml"`, `"380g"`
- [ ] Handles case-insensitive units: `"500G"`, `"2KG"`, `"1.5l"`
- [ ] Handles imperial units: `"16oz"` → g, `"1lb"` → g, `"2 fl oz"` → ml
- [ ] Returns `null` for: `""`, `"pack of 4"`, `"each"`, `"assorted"`
- [ ] Unit conversions: kg→g (×1000), L→ml (×1000), oz→g (×28.35), lb→g (×453.592), fl oz→ml (×29.574)

---

## TDD Requirements

- [ ] Write ALL unit price tests first — they are pure functions and easiest to test
- [ ] Write HTTP client tests with msw interceptors before implementation
- [ ] Write rate limiter tests using fake timers / concurrency simulation
- [ ] No implementation code written until a failing test exists for that behaviour

---

## Test Plan

```typescript
// backend/tests/utils/unit-price.test.ts
describe('parsePackageSize', () => {
  it('parses "500g" → { quantity: 500, unit: "g" }')
  it('parses "2kg" → { quantity: 2000, unit: "g" }')   // normalise to g
  it('parses "1.5L" → { quantity: 1500, unit: "ml" }')  // normalise to ml
  it('parses "2 x 250ml" → { quantity: 500, unit: "ml" }')
  it('returns null for "pack of 4"')
  it('returns null for empty string')
})

describe('computeDisplayUnitPrice', () => {
  it('500g at $4.45 → { unitPrice: 0.89, unitMeasure: "100g" }')
  it('2kg at $11.00 → { unitPrice: 5.50, unitMeasure: "kg" }')
  it('600ml at $1.50 → { unitPrice: 0.25, unitMeasure: "100ml" }')
  it('2L at $3.10 → { unitPrice: 1.55, unitMeasure: "L" }')
})

describe('computeNormalisedUnitPrice', () => {
  it('500g at $4.45 → 0.89')
  it('2kg at $11.00 → 0.55')  // same base as 500g example above
  it('returns null for count-based')
})

// backend/tests/utils/http-client.test.ts
describe('httpClient', () => {
  it('sends Chrome User-Agent header on every request')
  it('merges per-request headers with defaults')
  it('throws StoreApiError on 404 — not retryable')
  it('throws StoreApiError on 500 — retryable, retries once')
  it('does not retry more than once on 5xx')
  it('throws StoreApiError after 10s timeout with AbortError')
  it('waits 500ms before retry attempt')
})

// backend/tests/utils/rate-limiter.test.ts
describe('RateLimiter', () => {
  it('allows up to 2 concurrent requests per store')
  it('queues 3rd request until one slot frees')
})
```

---

## Implementation Notes

### Unit price thresholds
```
weight < 1000g  → display per 100g
weight >= 1000g → display per kg
volume < 1000ml → display per 100ml
volume >= 1000ml → display per L
```

### Multi-pack parsing
Regex for `"N x Xunit"` pattern: multiply N × X.
E.g., `"2 x 250ml"` → 500ml total.

### Retry logic
```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 1): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok && isRetryable(res.status) && retries > 0) {
      await delay(500);
      return fetchWithRetry(url, options, retries - 1);
    }
    return res;
  } catch (err) {
    if (isNetworkError(err) && retries > 0) {
      await delay(500);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

const isRetryable = (status: number) => status >= 500;
const isNetworkError = (err: unknown) => err instanceof Error &&
  (err.name === 'AbortError' || err.name === 'FetchError');
```

### HTTP client
Thin wrapper over native `fetch` (Node 18+). Return typed responses.
Do NOT use axios — keep the dependency footprint small.

### Rate limiter
Use a simple semaphore pattern: a counter + queue per store name.
No external library needed (p-limit is acceptable if preferred).

---

## Files to Create

| File | Description |
|------|-------------|
| `backend/src/utils/http-client.ts` | HTTP client with headers + timeout |
| `backend/src/utils/rate-limiter.ts` | Per-store concurrency limiter |
| `backend/src/utils/unit-price.ts` | `parsePackageSize`, `computeDisplayUnitPrice`, `computeNormalisedUnitPrice` |
| `backend/src/utils/errors.ts` | `StoreApiError` class |
| `backend/tests/utils/unit-price.test.ts` | Unit price tests |
| `backend/tests/utils/http-client.test.ts` | HTTP client tests (msw) |
| `backend/tests/utils/rate-limiter.test.ts` | Rate limiter tests |
