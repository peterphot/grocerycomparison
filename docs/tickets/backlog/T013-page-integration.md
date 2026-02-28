# T013 — Page Integration & API Client

## Status
- [x] Backlog
- [ ] In Progress
- [ ] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T010 + T011 + T012 (all three must be done)
- **Blocks**: T014, T015
- **Parallel with**: Nothing at this stage

---

## Summary

Wire everything together: implement the API client, integrate the form with the backend call,
manage loading/error/results state on the home page, and add the Header component.
After this ticket, the app is functionally complete end-to-end.

## Source
- `plan.md` → T024, T025, Section 6.1 (Pages), Section 6.5 (State Management)
- `designs.pen` → All 4 screens (form input → results transition)

---

## Acceptance Criteria

### API client (`frontend/src/lib/api.ts`)
- [ ] `searchGroceries(items: ShoppingListItem[]): Promise<ComparisonResponse>` posts to `http://localhost:4000/api/search`
- [ ] Throws typed `ApiError` with status code on non-2xx responses
- [ ] Includes `Content-Type: application/json` header

### Home page (`frontend/src/app/page.tsx`)
- [ ] Renders `<Header />` at top
- [ ] Renders `<ShoppingListForm>` in the left panel (desktop) / stacked (mobile)
- [ ] On form submit: transitions to loading state
- [ ] Shows `<LoadingSpinner />` while request is in-flight
- [ ] On success: renders `<ComparisonResults>` with response data
- [ ] On error: renders `<ErrorBanner>` with human-readable message
- [ ] "Edit list" button (visible in results state) returns to form state

### Header component
- [ ] Shows "GroceryCompare" logo in green (#16A34A), Plus Jakarta Sans bold 22px
- [ ] Shows tagline "Compare prices across Australian supermarkets" in muted text
- [ ] Shows "Beta" badge in light green
- [ ] Matches design: white background, subtle shadow, 64px height (desktop), 56px (mobile)

### LoadingSpinner component
- [ ] Displayed centred in the results area during fetch
- [ ] Uses shadcn `Skeleton` or animated spinner

### ErrorBanner component
- [ ] Shows user-friendly error message
- [ ] Offers "Try again" action (calls `onRetry` prop)

### Empty state (initial)
- [ ] Before any search, the right panel (desktop) / below form (mobile) shows an empty state
- [ ] Empty state contains: an illustration or large icon, heading "Compare prices in seconds", subtext "Add items above and click Compare Prices"
- [ ] Use a free SVG illustration (e.g., from Heroicons or a static file in `public/`)

### Utility functions (`frontend/src/lib/utils.ts`)
- [ ] `formatPrice(amount: number): string` — returns `"$4.65"`, rounds to 2 decimal places
- [ ] `formatUnitPrice(unitPrice: number, unitMeasure: string): string` — returns `"$1.55 / L"`
- [ ] Both are tested with edge cases (rounding, zero, null guard)

---

## TDD Requirements

- [ ] Use msw to mock `POST /api/search` in all page-level tests
- [ ] Test all three page states: loading, success, error
- [ ] Test "Edit list" button returns to form view
- [ ] Write API client tests separately (with msw) before implementing
- [ ] All tests written and failing before implementation begins

---

## Test Plan

```typescript
// frontend/tests/lib/utils.test.ts
describe('formatPrice', () => {
  it('formats 4.65 → "$4.65"')
  it('formats 4.6 → "$4.60"')
  it('rounds 1.5678 → "$1.57"')
  it('formats 0 → "$0.00"')
})

describe('formatUnitPrice', () => {
  it('formats (1.55, "L") → "$1.55 / L"')
  it('formats (0.89, "100g") → "$0.89 / 100g"')
})

// frontend/tests/lib/api.test.ts
describe('searchGroceries', () => {
  it('POSTs items to /api/search and returns ComparisonResponse')
  it('throws ApiError with status 400 on bad request')
  it('throws ApiError with status 500 on server error')
  it('includes Content-Type: application/json header')
})

// frontend/tests/app/page.test.tsx
describe('HomePage', () => {
  it('renders shopping list form initially')
  it('shows loading spinner while search is in-flight')
  it('renders comparison results after successful search')
  it('renders error banner when search fails')
  it('clicking Edit List returns to form view')
  it('renders Header on all states')
  it('shows empty state illustration before first search')
})

describe('utils', () => {
  it('formatPrice rounds and prepends dollar sign')
  it('formatUnitPrice builds "/$unit" label')
})

describe('Header', () => {
  it('renders GroceryCompare logo text')
  it('renders tagline')
  it('renders Beta badge')
})
```

---

## Implementation Notes

### Page state machine
```typescript
type PageState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; data: ComparisonResponse }
  | { status: 'error'; message: string }
```
Use `useState<PageState>` — keep it simple.

### Layout: desktop vs mobile
- Desktop: left panel (420px) with form, right panel with results/empty-state
- Mobile: stacked — form on top, results below
- Use Tailwind responsive classes: `md:flex-row flex-col`

### msw setup in frontend tests
Configure msw server in `frontend/tests/setup.ts` using `setupServer` from `msw/node`.
Register a handler for `POST http://localhost:4000/api/search` returning the mock fixture.

---

## Files to Create/Modify

| File | Description |
|------|-------------|
| `frontend/src/lib/api.ts` | `searchGroceries` API client |
| `frontend/src/lib/errors.ts` | `ApiError` class |
| `frontend/src/app/page.tsx` | Home page with full state management |
| `frontend/src/app/layout.tsx` | Root layout (fonts, metadata) |
| `frontend/src/app/globals.css` | Global CSS + Tailwind directives |
| `frontend/src/components/common/Header.tsx` | Site header |
| `frontend/src/components/common/LoadingSpinner.tsx` | Loading state |
| `frontend/src/components/common/ErrorBanner.tsx` | Error state |
| `frontend/src/components/common/EmptyState.tsx` | Initial empty panel state |
| `frontend/src/lib/utils.ts` | `formatPrice`, `formatUnitPrice` |
| `frontend/tests/lib/api.test.ts` | API client tests |
| `frontend/tests/lib/utils.test.ts` | Utility function tests |
| `frontend/tests/app/page.test.tsx` | Page integration tests |
| `frontend/tests/setup.ts` | msw server setup |
