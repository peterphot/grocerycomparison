# T015 — Error Handling & Polish

## Status
- [x] Backlog
- [x] In Progress
- [x] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T013
- **Blocks**: Nothing
- **Parallel with**: T014

---

## Summary

Add graceful degradation, loading skeletons, empty state handling, and UX polish.
This ticket takes the functionally-complete app from T013 and makes it production-quality.
Use T014's Playwright specs as a guide for what edge cases need UX treatment.

## Source
- `plan.md` → T026, Section 6.3 (Component Details)
- `designs.pen` → Desktop Input State empty state (nsAxf right panel)

---

## Acceptance Criteria

### Loading states
- [ ] `<LoadingSpinner />` replaced with `<ComparisonSkeleton />` showing 5 column skeletons
- [ ] Each skeleton column shows 3-5 grey shimmering rows matching the results layout
- [ ] Uses shadcn `Skeleton` component

### Empty results state
- [ ] When a store returns 0 matches for an item, `ItemRow` shows "Not available" clearly (grey, italic)
- [ ] When ALL stores fail to return results for an item, a subtle warning badge appears
- [ ] When the entire search returns no results at all, a friendly empty state is shown

### Partial store failures
- [ ] When 1–3 store adapters fail (backend returns them as unavailable), those store columns show a "Store unavailable" message
- [ ] Other stores' data is still shown normally
- [ ] User is informed that results may be incomplete

### All stores unavailable
- [ ] If all 4 stores fail, `ErrorBanner` is shown with "We couldn't reach any stores right now. Try again shortly."
- [ ] "Try again" button re-submits the current shopping list

### Network/timeout error
- [ ] If backend request times out (>15 seconds), `ErrorBanner` shown: "This is taking longer than usual. Try again?"
- [ ] Abort controller cancels the in-flight request on timeout

### Backend returns 429 (rate limited)
- [ ] `ErrorBanner` shows: "Too many requests. Please wait a moment and try again."

---

## TDD Requirements

- [ ] Add Vitest unit tests for each new error state component
- [ ] Add tests for `ErrorBanner` rendering different message variants
- [ ] Add tests for `ComparisonSkeleton` rendering the correct number of skeleton rows
- [ ] Playwright specs from T014 should drive which error states need testing — run them first

---

## Test Plan

```typescript
// frontend/tests/components/ComparisonSkeleton.test.tsx
describe('ComparisonSkeleton', () => {
  it('renders 5 column skeletons (4 stores + mix)')
  it('each column has multiple skeleton item rows')
})

// frontend/tests/components/ErrorBanner.test.tsx
describe('ErrorBanner', () => {
  it('shows all-stores-unavailable message')
  it('shows timeout message')
  it('shows rate-limit message')
  it('renders Try Again button')
  it('Try Again button calls onRetry prop')
})

// frontend/tests/components/ItemRow.test.tsx (extend existing)
describe('ItemRow — unavailable states', () => {
  it('shows "Not available" badge when match is null')
  it('does not show price when match is null')
})

// frontend/tests/components/StoreColumn.test.tsx (extend existing)
describe('StoreColumn — store failure', () => {
  it('shows "Store unavailable" when storeError is true')
})
```

---

## Implementation Notes

### Skeleton design
Match the shimmer style to the 5-column results grid:
```tsx
<div className="grid grid-cols-5 gap-3">
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="space-y-2">
      <Skeleton className="h-12 w-full" />  {/* Store header */}
      <Skeleton className="h-8 w-full" />   {/* Item row */}
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  ))}
</div>
```

### Request timeout
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15_000);
try {
  const response = await fetch(url, { signal: controller.signal });
} catch (err) {
  if (err.name === 'AbortError') throw new ApiError('timeout', 408);
} finally {
  clearTimeout(timeout);
}
```

### Error message mapping
```typescript
function getErrorMessage(error: ApiError): string {
  if (error.status === 408) return 'This is taking longer than usual. Try again?';
  if (error.status === 429) return 'Too many requests. Please wait a moment.';
  return "We couldn't reach any stores right now. Try again shortly.";
}
```

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `frontend/src/components/common/ComparisonSkeleton.tsx` | New loading skeleton |
| `frontend/src/components/common/ErrorBanner.tsx` | Extend with message variants + onRetry |
| `frontend/src/components/results/StoreColumn.tsx` | Add store-unavailable state |
| `frontend/src/components/results/ItemRow.tsx` | Ensure "Not available" styling is polished |
| `frontend/src/lib/api.ts` | Add AbortController timeout |
| `frontend/tests/components/ComparisonSkeleton.test.tsx` | New tests |
| `frontend/tests/components/ErrorBanner.test.tsx` | Extended tests |
