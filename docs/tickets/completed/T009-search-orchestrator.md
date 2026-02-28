# T009 — Search Orchestrator

## Status
- [x] Backlog
- [x] In Progress
- [x] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T004 + T005 + T006 + T007 + T008 (all must be done)
- **Blocks**: T010
- **Parallel with**: Nothing at this point

---

## Summary

Implement the search orchestrator: fan out each shopping list item to all 4 store adapters in
parallel, apply matching strategy (cheapest for brand-agnostic, best-match for brand-specific),
and assemble `ItemSearchResult[]` ready for the result builder.

## Source
- `plan.md` → T014, T015, Section 5.3 (Search Orchestrator), Section 5.4 (Matching Strategy)

---

## Acceptance Criteria

- [ ] `SearchOrchestrator.search(items: ShoppingListItem[]): Promise<ComparisonResponse>`
- [ ] All items searched across all 4 stores concurrently (fan-out with `Promise.allSettled`)
- [ ] For brand-agnostic items: selects cheapest available match per store (by price)
- [ ] For brand-specific items: selects first/closest match per store (API-relevance order)
- [ ] When a store adapter throws or rejects, that store's result is `null` for all items — search still returns
- [ ] Passes assembled `ItemSearchResult[]` to `ResultBuilder` and returns `ComparisonResponse`
- [ ] In-memory result cache: identical query within 30 seconds returns cached response without re-fetching
- [ ] Cache key format: `${normalizedItems}` (sorted item names + quantities)

---

## TDD Requirements

- [ ] Mock all 4 adapters — do not instantiate real adapters in tests
- [ ] Test the fan-out is concurrent (use timing or call-count assertions)
- [ ] Explicitly test graceful degradation: one adapter rejects, others succeed
- [ ] Test cache hit and cache miss behaviour
- [ ] Test brand-specific vs brand-agnostic matching rules

---

## Test Plan

```typescript
// backend/tests/services/search-orchestrator.test.ts
describe('SearchOrchestrator', () => {
  describe('search', () => {
    it('calls all 4 adapters for each item')
    it('returns ComparisonResponse with all stores')
    it('selects cheapest match for brand-agnostic items')
    it('selects first match for brand-specific items')
    it('returns partial results when one adapter fails')
    it('marks all items as unavailable for a failed store')
    it('fans out concurrently — does not wait for each store sequentially')
  })

  describe('cache', () => {
    it('returns cached result on identical query within 30s')
    it('fetches fresh result after cache TTL expires')
    it('treats different item orderings as the same cache key')
  })
})
```

---

## Implementation Notes

### Parallel fan-out shape
```typescript
// For each item, fan out to all stores at once
const results = await Promise.allSettled(
  items.map(item =>
    Promise.allSettled(
      this.adapters.map(adapter => adapter.searchProduct(item.name))
    )
  )
);
```

### Graceful degradation
`Promise.allSettled` (not `Promise.all`) ensures one failing store doesn't block the rest.
A rejected adapter result produces `{ status: 'rejected' }` — treat as empty matches for that store.

### Cache
Simple `Map<string, { response: ComparisonResponse; expiresAt: number }>`.
Normalise cache key by sorting items alphabetically and joining: `"2×milk,1×bread"`.

---

## Files to Create

| File | Description |
|------|-------------|
| `backend/src/services/search-orchestrator.ts` | `SearchOrchestrator` class |
| `backend/src/services/cache.ts` | In-memory result cache |
| `backend/tests/services/search-orchestrator.test.ts` | Orchestrator tests |
