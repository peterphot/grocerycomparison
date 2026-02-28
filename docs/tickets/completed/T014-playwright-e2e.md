# T014 — Playwright E2E Tests

## Status
- [x] Backlog
- [x] In Progress
- [x] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T013
- **Blocks**: Nothing
- **Parallel with**: T015

---

## Summary

Write end-to-end Playwright tests covering the critical user journeys: adding items, comparing
prices, viewing results on desktop and mobile viewports, and graceful error handling.
Tests run against both frontend and backend with the backend API mocked at the network level.

## Source
- `plan.md` → Section 9 (Testing Strategy)
- `designs.pen` → All 4 screens

---

## Acceptance Criteria

- [ ] Playwright config has `webServer` entries starting both frontend (3000) and a mock backend (4000)
- [ ] Mock backend server (using msw or a simple Express fixture server) intercepts all store API calls and returns fixture data
- [ ] Tests cover desktop viewport (1440×900) and mobile viewport (390×844)
- [ ] All specs pass in CI (`npm run test:e2e`)

### User Journeys Tested

**Journey 1: Basic comparison (desktop)**
- [ ] Page loads showing empty shopping list form
- [ ] User types "milk 2L" in the first item field
- [ ] User clicks "Add item", types "bread"
- [ ] User clicks "Compare Prices"
- [ ] Loading spinner appears
- [ ] Results appear with 5 columns (4 stores + Mix & Match)
- [ ] Each column shows a price for both items
- [ ] Cheapest store column is visually highlighted

**Journey 2: Brand-specific toggle**
- [ ] User adds item "Vegemite 380g" with brand toggle enabled
- [ ] Results appear and brand-specific item shows the matched product name

**Journey 3: Results on mobile**
- [ ] Viewport set to 390×844
- [ ] Form stacks vertically
- [ ] After comparing, tab bar appears with store names
- [ ] Tapping each tab shows that store's prices
- [ ] Mix & Match tab is accessible

**Journey 4: Remove item**
- [ ] User adds 2 items
- [ ] User removes the first item
- [ ] Only 1 item remains (remove button disappears from last item)
- [ ] Minimum 1 item enforced

**Journey 5: Error state**
- [ ] Mock backend returns 500
- [ ] Error banner appears with user-friendly message
- [ ] User can try again

**Journey 6: All stores fail**
- [ ] All store adapters return errors
- [ ] Results still appear, all items marked "Not available"

**Journey 7: Initial empty state**
- [ ] Page loads with no search performed
- [ ] Right panel (desktop) shows empty state: illustration + "Compare prices in seconds" heading
- [ ] Empty state is not shown after a search

**Journey 8: Edit list after viewing results**
- [ ] User compares prices and sees results
- [ ] Clicks "Edit List" button
- [ ] Shopping list form reappears with items still populated
- [ ] User can modify an item and re-compare

**Journey 9: Quantity affects line total**
- [ ] User adds "milk" with quantity 3
- [ ] After comparing, line total shown is price × 3 (not just price)
- [ ] Store total reflects quantity-adjusted amounts

---

## TDD Notes

E2E tests are **regression tests, not TDD** — they can only run after T013 is complete.
Their role is different from unit tests:
- Unit tests (T002–T013): drive implementation via red-green-refactor
- E2E tests (T014): verify integrated behaviour and expose UX gaps that inform T015 polish

Guidelines:
- [ ] Each spec must have a clear, explicit assertion (not just "no console errors")
- [ ] Use `page.getByRole`, `page.getByText`, `page.getByLabel` over CSS selectors
- [ ] E2E specs run in CI after unit tests pass
- [ ] Failures in T014 create concrete scope for T015 — do not mark T015 complete until all E2E pass

---

## Test Plan (file structure)

```
e2e/
├── fixtures/
│   ├── mock-server.ts          (msw/express fixture server)
│   └── comparison-response.ts  (fixture data for mock server)
├── helpers/
│   └── shopping.ts             (page object helpers: fillItem, clickCompare, etc.)
├── desktop-comparison.spec.ts
├── mobile-comparison.spec.ts
├── form-interactions.spec.ts
└── error-states.spec.ts
```

---

## Implementation Notes

### Mock backend approach
Use a lightweight Express server at port 4000 in test mode. It must support:
- Default: returns a full `ComparisonResponse` fixture (all 4 stores, 3 items, one unavailable item)
- Configurable failure modes via query param or header: `?scenario=coles-fail`, `?scenario=all-fail`
- Realistic partial failure: Coles returns 500, other stores succeed
- Timeout simulation: one store takes 11s (exceeds 10s timeout)

Configure in `playwright.config.ts`:
```typescript
webServer: [
  { command: 'npm run dev --workspace=frontend', port: 3000, reuseExistingServer: true },
  { command: 'npm run mock-server', port: 4000, reuseExistingServer: true },
]
```

The mock server must cover these scenarios for the 9 journeys:
| Scenario | What it returns |
|----------|----------------|
| default | Full response: all 4 stores, prices vary, one item unavailable at Aldi |
| `all-fail` | 503 — all stores unavailable |
| `partial-fail` | Coles store marked as unavailable, others return data |
| `empty-results` | All stores return empty matches for all items |

### Page object helpers
Avoid repeating selector logic — extract into helpers:
```typescript
// e2e/helpers/shopping.ts
export async function fillItem(page, index, name, quantity = 1) { ... }
export async function clickCompare(page) { ... }
export async function waitForResults(page) { ... }
```

### Viewport config
```typescript
// playwright.config.ts
projects: [
  { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
]
```

### Accessibility assertions
Add `expect(page).toHaveNoAccessibilityViolations()` using `@axe-core/playwright` on key pages.

---

## Files to Create

| File | Description |
|------|-------------|
| `playwright.config.ts` | Playwright config (update from T001 placeholder) |
| `e2e/fixtures/mock-server.ts` | Fixture backend server |
| `e2e/fixtures/comparison-response.ts` | Mock response data |
| `e2e/helpers/shopping.ts` | Page object helpers |
| `e2e/desktop-comparison.spec.ts` | Desktop journey tests |
| `e2e/mobile-comparison.spec.ts` | Mobile journey tests |
| `e2e/form-interactions.spec.ts` | Form add/remove tests |
| `e2e/error-states.spec.ts` | Error state tests |
