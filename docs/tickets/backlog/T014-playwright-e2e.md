# T014 — Playwright E2E Tests

## Status
- [x] Backlog
- [ ] In Progress
- [ ] Completed

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

---

## TDD Notes

Playwright E2E tests are not strictly TDD (you can't run E2E against non-existent code), but:
- [ ] Write E2E specs BEFORE T015 polish work begins — they should expose UX gaps
- [ ] Each spec must have a clear assertion (not just "no errors thrown")
- [ ] Use `page.getByRole`, `page.getByText` over CSS selectors — tests should match user intent

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
Use a lightweight Express server at port 4000 in test mode, returning fixture data.
Configure in `playwright.config.ts`:
```typescript
webServer: [
  { command: 'npm run dev --workspace=frontend', port: 3000, reuseExistingServer: true },
  { command: 'npm run mock-server', port: 4000, reuseExistingServer: true },
]
```

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
