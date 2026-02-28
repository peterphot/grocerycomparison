# T016 — User Flow Testing: Bugs & Missing Features

## Status
- [x] Backlog
- [ ] In Progress
- [ ] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T015
- **Blocks**: Nothing
- **Parallel with**: Nothing

---

## Summary

Manual testing of all 10 user flows (documented in `docs/user-flows.md`) against the running app via Chrome DevTools revealed **13 issues** spanning backend wiring, frontend validation, mobile layout, and results display. The most critical issue — store adapters not being wired into the backend — means the app currently returns zero results for every search.

## Source
- `docs/user-flows.md` — User flow definitions
- `docs/test-plan.md` — Test plan (132 test cases)
- Manual testing via Chrome DevTools MCP on 2026-02-28

---

## Issues Found

### CRITICAL — App non-functional

#### Issue 1: Backend adapters not wired (all stores return empty)
- **Severity**: Critical (app completely broken)
- **File**: `backend/src/app.ts:17`
- **Flow(s)**: ALL flows (2-10)
- **Description**: The `SearchOrchestrator` is constructed with an empty adapter array: `new SearchOrchestrator([])`. No store adapters (Woolworths, Coles, Aldi, Harris Farm) are ever instantiated or registered. Every search returns `matches: []` for every item, and the frontend shows "Not available" for all stores with $0.00 totals.
- **Evidence**: Verified externally — `curl` to Woolworths and Aldi APIs returns real product data. The backend silently returns 200 OK with empty results.
- **Fix**: Import and instantiate all four adapters in `app.ts`:
  ```typescript
  import { WoolworthsAdapter } from './adapters/woolworths.js';
  import { ColesAdapter } from './adapters/coles.js';
  import { AldiAdapter } from './adapters/aldi.js';
  import { HarrisFarmAdapter } from './adapters/harris-farm.js';
  import { ColesSessionManager } from './utils/coles-session.js';

  const adapters = [
    new WoolworthsAdapter(),
    new ColesAdapter(new ColesSessionManager()),
    new AldiAdapter(),
    new HarrisFarmAdapter(),
  ];
  const orchestrator = new SearchOrchestrator(adapters);
  ```

---

### HIGH — Mobile layout broken

#### Issue 2: No tab layout on mobile — desktop grid used at all viewports
- **Severity**: High
- **File**: `frontend/src/components/results/ComparisonResults.tsx:28`
- **Flow(s)**: Flow 2.3, Flow 10
- **Description**: The results use a CSS grid with `gridTemplateColumns: repeat(N, minmax(0, 1fr))` at all viewport sizes. On mobile (390px), this crams 5 columns into ~78px each, causing severe truncation of store names ("Woolw...", "Cole..."), item text ("Not availab..."), and prices ("$0.0"). Per the spec and design (`pencil-new.pen` screen `xOuKy`), mobile should use a **tabbed interface** — one store per tab.
- **Evidence**: Screenshot at 390px and 320px both show unreadable, truncated 5-column layout. No `<Tabs>` component or responsive breakpoint switching exists in the codebase.
- **Fix**: Add responsive layout switching:
  - Desktop (md+): Keep current side-by-side grid
  - Mobile (<md): Switch to shadcn `Tabs` component with one tab per store + Mix & Match

---

### HIGH — Validation bugs

#### Issue 3: Empty item names not blocked by frontend
- **Severity**: High
- **File**: `frontend/src/hooks/useShoppingList.ts:42-44`
- **Flow(s)**: Flow 8
- **Description**: `canSearch` uses `items.some(item => item.name.trim().length > 0)` — the search button is enabled as long as ANY item has a name. Items with empty names are included in the API request. If a user adds 3 items but only fills in 2 names, the empty-name item is sent to the backend and searched for `""`.
- **Fix**: Either:
  - (a) Filter out empty-name items before calling `onSubmit` in `ShoppingListForm.handleSubmit`, OR
  - (b) Change `canSearch` to `items.every(item => item.name.trim().length > 0)` so ALL items must have names, OR
  - (c) Visually highlight empty-name items and prevent submission until corrected

#### Issue 4: Backend does not validate empty item names
- **Severity**: High
- **File**: `backend/src/routes/search.ts` (validation logic)
- **Flow(s)**: Flow 8
- **Description**: The backend validates that `items` is a non-empty array, but does NOT validate that each item has a non-empty `name` field. Sending `{"items":[{"id":"1","name":"","quantity":1,"isBrandSpecific":false}]}` returns 200 with empty results instead of 400.
- **Fix**: Add validation: reject items where `name.trim()` is empty. Return 400 with an error message like `"Each item must have a non-empty name"`.

---

### MEDIUM — Results display issues

#### Issue 5: Item names not shown in results rows
- **Severity**: Medium
- **File**: `frontend/src/components/results/ItemRow.tsx`
- **Flow(s)**: Flow 2.2, Flow 6
- **Description**: When an item is unavailable (`match === null`), the row only shows "Not available" with no indication of WHICH shopping list item it refers to. Even when a match exists, the user's original search term is not shown — only the matched product name. With multiple items, users cannot tell which row corresponds to which item from their list.
- **Fix**: Pass `shoppingListItemName` to `ItemRow` and display it as a label above or alongside the match. For unavailable items, show the item name with "Not available" beneath it.

#### Issue 6: No unavailable count displayed per store
- **Severity**: Medium
- **File**: `frontend/src/components/results/StoreColumn.tsx`
- **Flow(s)**: Flow 6.1
- **Description**: Per the spec, each store column should display an unavailable count (e.g., "2 items unavailable") when some items have no match. The `StoreTotal` object has `unavailableCount` and `allItemsAvailable` fields, but the `StoreColumn` component does not render them.
- **Fix**: Add a conditional line below the item rows (before the total) showing `"X items unavailable"` when `storeTotal.unavailableCount > 0`.

#### Issue 7: "Best single store" banner shown when all items unavailable
- **Severity**: Medium
- **File**: `frontend/src/components/results/ComparisonResults.tsx:23-25`, `frontend/src/lib/utils.ts:16-20`
- **Flow(s)**: Flow 6.2, Flow 7.3
- **Description**: When all stores return $0.00 (all items unavailable), the banner still shows "Best single store: Woolworths $0.00". `findCheapestStore` falls back to picking the first store in the array when none has all items available. This is misleading — there's no meaningful "best" store when nothing was found.
- **Fix**: Hide the banner or show a different message (e.g., "No results found across any store") when all stores have `total === 0` or `unavailableCount === items.length`.

#### Issue 8: Woolworths column header text truncated on desktop
- **Severity**: Medium
- **File**: `frontend/src/components/results/StoreHeader.tsx` (and grid column width)
- **Flow(s)**: Flow 2.2
- **Description**: At normal desktop width, the Woolworths store header shows "Woolwor" — the text is clipped. The 5-column equal-width grid doesn't give enough space for the longest store name.
- **Fix**: Either use `text-sm` / shorter display names, allow column widths to vary (e.g., `auto` for store name columns), or truncate with an ellipsis and show full name on hover/tooltip.

---

### MEDIUM — UX / layout issues

#### Issue 9: Form hidden when results are shown
- **Severity**: Medium
- **File**: `frontend/src/app/page.tsx:63-76`
- **Flow(s)**: Flow 9
- **Description**: When results are displayed, the `ShoppingListForm` is completely hidden and replaced with an "Edit List" button. Per the user flow spec (Flow 9): "the user scrolls back up to the shopping list form (which remains visible above the results)". Users must click "Edit List" to return to the form, losing sight of results.
- **Fix**: Keep the form visible alongside results (either above on mobile, or in a left sidebar on desktop as the `md:flex-row` layout already partially supports). The "Edit List" button approach could remain as a mobile affordance, but results and the form should be simultaneously visible on desktop.

---

### LOW — Backend resilience

#### Issue 10: HTTP client `redirect: 'error'` causes silent failures
- **Severity**: Low (latent — not currently hit because adapters aren't wired)
- **File**: `backend/src/utils/http-client.ts:39`
- **Flow(s)**: Flow 7.1
- **Description**: The HTTP client uses `redirect: 'error'` which throws a `TypeError` on any HTTP redirect (3xx). This error is caught by the generic catch block and converted to a `StoreApiError('Network error')`, which the orchestrator's `Promise.allSettled` then silently converts to `[]`. If any store API redirects (CAPTCHA, CDN, auth redirect), the store silently returns no results with no error surfaced to the user.
- **Fix**: Change to `redirect: 'follow'` (the default) or `redirect: 'manual'` with explicit redirect handling. Alternatively, catch redirect responses explicitly and surface them as a meaningful error.

#### Issue 11: Coles session cookies may be lost on redirects
- **Severity**: Low (latent)
- **File**: `backend/src/utils/coles-session.ts`
- **Flow(s)**: Flow 7.2
- **Description**: The Coles session manager uses `res.headers.getSetCookie()` which only captures cookies from the final response in a redirect chain. If Coles sets session cookies on intermediate redirects (common with CDN/WAF), those cookies are silently dropped, causing subsequent requests to fail auth checks.
- **Fix**: Use a cookie jar library (e.g., `tough-cookie`) that accumulates cookies across redirects, or handle redirects manually to capture all Set-Cookie headers.

---

### LOW — Missing features

#### Issue 12: No loading skeleton observed during search
- **Severity**: Low
- **File**: `frontend/src/app/page.tsx:80`
- **Flow(s)**: Flow 2.1
- **Description**: The `ComparisonSkeleton` component exists in the codebase and is referenced in the page component (`pageState.status === 'loading'`). However, during testing the transition from form to results appeared instantaneous (the backend returns empty results immediately since no adapters are wired). Once adapters are wired and real API calls take 2-10 seconds, the skeleton should be visible. **Needs re-testing after Issue 1 is fixed.**

#### Issue 13: Mix & Match column doesn't indicate source store per item
- **Severity**: Low
- **File**: `frontend/src/components/results/MixAndMatchColumn.tsx`
- **Flow(s)**: Flow 2.4
- **Description**: Per the spec, each row in the Mix & Match column should indicate which store the cheapest price came from. Cannot verify this until Issue 1 is fixed and real data flows through. **Needs re-testing after Issue 1 is fixed.**

---

## Acceptance Criteria

### Must fix (Critical + High)
- [ ] Store adapters are wired into the SearchOrchestrator — real search results returned
- [ ] Mobile results use a tabbed layout (one tab per store) instead of 5-column grid
- [ ] Empty item names are either filtered out before search or block submission
- [ ] Backend validates non-empty item names (returns 400)

### Should fix (Medium)
- [ ] Item rows show the shopping list item name (not just product name or "Not available")
- [ ] Store columns show unavailable count when > 0
- [ ] "Best single store" banner is hidden or shows a different message when all items unavailable
- [ ] Woolworths column header text is not truncated on desktop
- [ ] Form remains visible alongside results on desktop (not hidden behind "Edit List" button)

### Nice to fix (Low)
- [ ] HTTP client handles redirects gracefully instead of `redirect: 'error'`
- [ ] Coles session manager preserves cookies across redirect chains
- [ ] Re-verify loading skeleton appears during real searches (after Issue 1 fix)
- [ ] Re-verify Mix & Match shows source store per item (after Issue 1 fix)

---

## Test Plan

After fixes, re-run manual testing of all 10 user flows per `docs/user-flows.md`.

Specific regression tests:
```
# Backend adapter wiring
curl -s -X POST http://localhost:4000/api/search \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"1","name":"milk","quantity":1,"isBrandSpecific":false}]}' \
  | jq '.storeTotals[0].items[0].match'
# Should return a non-null ProductMatch object

# Backend validation
curl -s -X POST http://localhost:4000/api/search \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"1","name":"","quantity":1,"isBrandSpecific":false}]}'
# Should return 400

# Mobile layout
# Emulate 390x844 viewport in Chrome DevTools
# Results should show tabs, not 5-column grid
```

---

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/app.ts` | Wire up all 4 store adapters into SearchOrchestrator |
| `backend/src/routes/search.ts` | Add validation: reject items with empty names |
| `backend/src/utils/http-client.ts` | Change `redirect: 'error'` to `redirect: 'follow'` |
| `frontend/src/hooks/useShoppingList.ts` | Filter empty-name items or change `canSearch` logic |
| `frontend/src/components/results/ComparisonResults.tsx` | Add responsive tabs for mobile; hide "best store" when all unavailable |
| `frontend/src/components/results/StoreColumn.tsx` | Display unavailable count |
| `frontend/src/components/results/ItemRow.tsx` | Accept and display `shoppingListItemName` prop |
| `frontend/src/components/results/MixAndMatchColumn.tsx` | Verify source store indication (after adapter fix) |
| `frontend/src/components/results/StoreHeader.tsx` | Fix text truncation on Woolworths |
| `frontend/src/app/page.tsx` | Keep form visible alongside results on desktop |
