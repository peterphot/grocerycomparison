# T016 — E2E Test Coverage Improvements

## Status
- [x] Backlog
- [ ] In Progress
- [ ] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T014, T015
- **Blocks**: Nothing
- **Parallel with**: Nothing

---

## Summary

The current Playwright E2E suite (11 tests, 4 files) covers the happy-path skeleton but has critical gaps that allowed a showstopper bug to ship: the backend instantiates `SearchOrchestrator` with zero adapters (`app.ts:17`), so every real search returns empty results. The E2E tests don't catch this because they mock the backend entirely — no test ever verifies that the real backend returns populated data, and no test asserts on the *content* of results (only that column headings are visible).

This ticket fixes the adapter wiring bug and comprehensively hardens the E2E suite so that functional regressions like this are caught automatically.

---

## Phase 0: Fix the Adapter Wiring Bug

The root cause of the broken dev server: `backend/src/app.ts` line 17 passes an empty array to `SearchOrchestrator`. The adapters exist but are never instantiated.

### Acceptance Criteria
- [ ] `backend/src/app.ts` imports and instantiates all 4 adapters (Woolworths, Coles, Aldi, Harris Farm) and passes them to `SearchOrchestrator`
- [ ] `ColesAdapter` receives a `ColesSessionManager` instance
- [ ] Backend unit test added: verify `app.ts` creates an orchestrator with 4 adapters (or an integration test that POSTs to `/api/search` on the real app and gets non-empty `storeTotals`)
- [ ] Dev server (`npm run dev`) returns populated comparison results for a real search

### Files to Modify
| File | Change |
|------|--------|
| `backend/src/app.ts` | Import + instantiate all 4 adapters, pass to `SearchOrchestrator` |
| `backend/tests/app.test.ts` | New — verify adapter wiring |

---

## Phase 1: Assert Results Content (not just structure)

The single biggest gap. Current tests verify that store column headings appear but never check that items, prices, unit prices, or Mix & Match content actually render. A bug that returns empty data in the correct structure goes undetected.

### Acceptance Criteria
- [ ] Desktop comparison test asserts each store column contains the expected product name(s) from the fixture
- [ ] Desktop comparison test asserts each store column shows the correct price for each item
- [ ] Desktop comparison test asserts unit price is displayed (e.g. "$1.75/L")
- [ ] Desktop comparison test asserts store totals are correct
- [ ] Mix & Match column content is verified: item breakdown + total
- [ ] "Not available" items verified to NOT contribute to store total
- [ ] Brand toggle test verifies the matched product name appears in at least one store column
- [ ] Quantity test asserts both line total AND store total reflect the multiplied amount

### Files to Modify
| File | Change |
|------|--------|
| `e2e/desktop-comparison.spec.ts` | Add content assertions to Journeys 1, 2, 9 |
| `e2e/fixtures/comparison-response.ts` | Add unit price fields to fixture if missing |

---

## Phase 2: Loading State Verification

No test currently asserts that the loading/skeleton state appears between clicking "Compare Prices" and results rendering. The reported bug (loading state skipped, straight to empty results) would have been caught here.

### Acceptance Criteria
- [ ] Test verifies that clicking "Compare Prices" shows a loading indicator (skeleton or spinner) before results appear
- [ ] Test verifies the loading state disappears once results render
- [ ] Mock server adds a configurable delay (e.g. 500ms) so loading state is observable
- [ ] Test verifies the "Compare Prices" button is disabled during loading (prevents double-submit)

### Implementation Notes
Add a delay endpoint to the mock server:
```typescript
// In mock-server.ts, add artificial delay for loading state tests
app.post('/api/search', async (req, res) => {
  const delay = parseInt(req.headers['x-test-delay'] as string) || 0;
  if (delay > 0) await new Promise(r => setTimeout(r, delay));
  // ... existing logic
});
```

Use Playwright's `page.route()` to add delay per-test where needed.

### Files to Modify/Create
| File | Change |
|------|--------|
| `e2e/desktop-comparison.spec.ts` | Add loading state test |
| `e2e/fixtures/mock-server.ts` | Add delay support via header |

---

## Phase 3: Expanded Error Scenarios

Only HTTP 500 is tested. Missing: network timeout, rate limiting, partial store failures, and total unavailability.

### Acceptance Criteria
- [ ] Test: network timeout → error banner with timeout-specific message
- [ ] Test: HTTP 429 → error banner with rate-limit message
- [ ] Test: all items return "Not available" at every store → appropriate empty-results message
- [ ] Test: partial store failure (1-2 stores unavailable) → remaining stores still show data, unavailable stores show "Store unavailable" message
- [ ] Test: rapid double-click on "Compare Prices" does not produce duplicate requests or broken state

### Mock Server Scenarios
Add scenario support to the mock server via a request header or query param:

| Scenario | Behavior |
|----------|----------|
| `timeout` | Responds after 20s (exceeds frontend timeout) |
| `rate-limit` | Returns 429 |
| `all-unavailable` | Returns 200 with all items `null` across all stores |
| `partial-fail` | Returns 200 with Coles and Aldi stores marked unavailable |

### Files to Modify
| File | Change |
|------|--------|
| `e2e/error-states.spec.ts` | Add timeout, 429, all-unavailable, partial-fail, double-submit tests |
| `e2e/fixtures/mock-server.ts` | Add scenario routing via `x-test-scenario` header or query param |
| `e2e/fixtures/comparison-response.ts` | Add partial-fail and all-unavailable fixture variants |

---

## Phase 4: Mobile Test Expansion

Only 1 mobile test exists (basic flow). No coverage for responsive breakpoints, scrolling with many items, or mobile-specific interactions.

### Acceptance Criteria
- [ ] Mobile test verifies tab-per-store layout (tap each store tab, content changes)
- [ ] Mobile test verifies Mix & Match tab is accessible and shows content
- [ ] Mobile test with 5+ items verifies scroll behavior (all items visible via scroll)
- [ ] Tablet breakpoint test (768×1024) verifies layout is usable
- [ ] Mobile error state test: error banner renders correctly on small viewport
- [ ] Mobile form test: add/remove items works at mobile viewport

### Files to Modify
| File | Change |
|------|--------|
| `e2e/mobile-comparison.spec.ts` | Expand from 1 test to 6 |
| `e2e/fixtures/comparison-response.ts` | Add 5-item fixture variant for scroll testing |

---

## Phase 5: Edge Cases and Input Validation

No boundary testing exists. Malformed inputs, extreme values, and special characters are untested.

### Acceptance Criteria
- [ ] Whitespace-only item name: "Compare Prices" button remains disabled or strips whitespace
- [ ] Special characters in item name (e.g. "müsli", "Ben & Jerry's"): search completes without error
- [ ] Very long item name (100+ chars): UI doesn't break, text truncates gracefully
- [ ] Quantity edge cases: quantity 1 (default works), quantity 99 (large value renders)
- [ ] 10 items in list: form remains usable, results render all 10 rows per store
- [ ] Duplicate item names: both appear in results independently

### Files to Modify/Create
| File | Change |
|------|--------|
| `e2e/form-interactions.spec.ts` | Add edge case tests |
| `e2e/desktop-comparison.spec.ts` | Add 10-item and duplicate-item tests |
| `e2e/fixtures/mock-server.ts` | Handle dynamic item counts in mock responses |

---

## Phase 6: Accessibility Testing

Zero accessibility assertions exist. Keyboard users and screen readers are untested.

### Acceptance Criteria
- [ ] Install `@axe-core/playwright` and add axe scan to at least 2 key pages (form state, results state)
- [ ] Keyboard navigation test: Tab through form fields → fill items → Tab to "Compare Prices" → Enter submits
- [ ] Keyboard navigation test: Tab through results (store columns, items) in logical order
- [ ] Focus management: after clicking "Compare Prices", focus moves to results area (not stuck on button)
- [ ] Focus management: after clicking "Edit List", focus moves back to first form field
- [ ] ARIA live region: results area announces to screen readers when results load

### Files to Create/Modify
| File | Change |
|------|--------|
| `e2e/accessibility.spec.ts` | New file — axe scans + keyboard navigation + focus management |
| `package.json` | Add `@axe-core/playwright` dev dependency |

---

## Phase 7: Cross-Browser and Visual Regression

Only Chromium is tested. No Firefox/WebKit coverage. No visual regression baseline.

### Acceptance Criteria
- [ ] Playwright config adds Firefox and WebKit projects
- [ ] Core happy-path test (Journey 1) runs on all 3 browsers
- [ ] Visual snapshot test: capture screenshot of results state on desktop, compare against baseline
- [ ] Visual snapshot test: capture screenshot of results state on mobile, compare against baseline
- [ ] CI pipeline runs all 3 browser projects

### Files to Modify
| File | Change |
|------|--------|
| `playwright.config.ts` | Add Firefox + WebKit projects, configure snapshot directory |
| `e2e/desktop-comparison.spec.ts` | Add visual snapshot assertion to Journey 1 |
| `e2e/mobile-comparison.spec.ts` | Add visual snapshot assertion to Journey 3 |

---

## Test Count Estimate

| Phase | New Tests | Cumulative |
|-------|-----------|------------|
| Current | — | 11 |
| Phase 0 (bug fix) | 1 backend test | 11 + 1 |
| Phase 1 (results content) | ~8 new assertions in existing tests | 11 |
| Phase 2 (loading state) | 2 | 13 |
| Phase 3 (error scenarios) | 5 | 18 |
| Phase 4 (mobile) | 5 | 23 |
| Phase 5 (edge cases) | 6 | 29 |
| Phase 6 (accessibility) | 5 | 34 |
| Phase 7 (cross-browser) | 2 visual + existing on 2 extra browsers | 36+ |

---

## Priority Order

Phases are ordered by impact — each catches progressively less critical bugs:

1. **Phase 0** — Fix the actual bug. Nothing else matters if the app doesn't work.
2. **Phase 1** — Assert content. Prevents the class of bug where structure is correct but data is empty/wrong.
3. **Phase 2** — Loading state. Catches state machine regressions (the exact symptom reported).
4. **Phase 3** — Error scenarios. Prevents degraded UX under failure conditions.
5. **Phase 4** — Mobile. Catches responsive layout regressions.
6. **Phase 5** — Edge cases. Prevents input-related crashes.
7. **Phase 6** — Accessibility. Ensures the app is usable by everyone.
8. **Phase 7** — Cross-browser + visual. Catches rendering inconsistencies.

---

## Notes

- Phases 0–3 are high priority and should be done as a batch
- Phases 4–5 are medium priority
- Phases 6–7 are nice-to-haves that add long-term confidence
- The mock server needs refactoring to support scenario-based responses (Phase 3) — this is a prerequisite for several phases
- Consider adding `@axe-core/playwright` early even if full a11y tests come later — axe scans are low-effort, high-value
