# T010 — Express Server & Search API Route

## Status
- [x] Backlog
- [ ] In Progress
- [ ] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T009
- **Blocks**: T013
- **Parallel with**: T011, T012 (frontend work continues independently)

---

## Summary

Wire up the Express server: register the `POST /api/search` route, add request validation,
CORS, error handling middleware, and connect the orchestrator. This is the last backend ticket —
after this the API is fully functional.

## Source
- `plan.md` → T018, T019, Section 5.1 (Express Server Structure)

---

## Acceptance Criteria

- [ ] Express server starts on port 4000
- [ ] `POST /api/search` accepts `{ items: ShoppingListItem[] }` and returns `ComparisonResponse`
- [ ] Returns `400` with descriptive error when `items` is missing or empty
- [ ] Returns `400` when any item fails type validation
- [ ] Returns `500` with generic error when orchestrator throws unexpectedly
- [ ] CORS configured to allow requests from `http://localhost:3000`
- [ ] Response always includes `Content-Type: application/json`
- [ ] Health check endpoint: `GET /api/health` returns `{ status: "ok" }`
- [ ] Integration test (supertest) covers all above without hitting real store APIs

---

## TDD Requirements

- [ ] Write supertest integration tests BEFORE implementing the route handler
- [ ] Mock `SearchOrchestrator` at the module level in tests — no real adapters
- [ ] Test all HTTP status codes (200, 400, 500)
- [ ] Test CORS header presence
- [ ] All tests pass with mocked orchestrator before wiring real orchestrator

---

## Test Plan

```typescript
// backend/tests/routes/search.test.ts
describe('POST /api/search', () => {
  it('returns 200 with ComparisonResponse for valid request')
  it('returns 400 when items array is missing from body')
  it('returns 400 when items array is empty')
  it('returns 400 when an item is missing required fields')
  it('returns 500 when orchestrator throws unexpected error')
  it('includes Access-Control-Allow-Origin header for localhost:3000')
  it('responds to OPTIONS preflight with 204')
})

describe('GET /api/health', () => {
  it('returns 200 with { status: "ok" }')
})
```

---

## Implementation Notes

### Request validation
Use a simple inline validation (check `Array.isArray(items)`, `items.length > 0`, each item
passes `isShoppingListItem` guard from shared types). No Zod to keep it lean.

### CORS
```typescript
app.use(cors({ origin: 'http://localhost:3000' }));
```
For production, this would come from an environment variable.

### Error middleware
```typescript
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

### Config module
`backend/src/config.ts` must export all constants (sourced from env with defaults):
```typescript
export const config = {
  port: Number(process.env.PORT ?? 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 10_000),
  colesSessionTtlMs: Number(process.env.COLES_SESSION_TTL_MS ?? 300_000),
  resultCacheTtlMs: Number(process.env.RESULT_CACHE_TTL_MS ?? 30_000),
  maxConcurrentPerStore: Number(process.env.MAX_CONCURRENT_PER_STORE ?? 2),
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  aldiOrigin: 'https://www.aldi.com.au',
  aldiReferer: 'https://www.aldi.com.au/',
} as const;
```

### Entry point structure
`backend/src/index.ts` creates the Express app, registers middleware and routes, then starts listening.
Keep `app` creation separate from `listen()` call so supertest can import the app without starting a server.

---

## Files to Create/Modify

| File | Description |
|------|-------------|
| `backend/src/index.ts` | Express app entry + server start |
| `backend/src/app.ts` | Express app creation (separate from listen) |
| `backend/src/routes/search.ts` | `POST /api/search` route handler |
| `backend/src/config.ts` | All constants from env with defaults |
| `backend/tests/routes/search.test.ts` | Supertest integration tests |
