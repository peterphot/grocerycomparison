# Test Plan: Grocery Price Comparison App

## Overview

This document provides a comprehensive test plan mapped to each user flow defined in `docs/user-flows.md`. Tests span three layers:

| Layer | Framework | Location |
|-------|-----------|----------|
| Unit / Component | Vitest + React Testing Library + MSW | `frontend/tests/`, `backend/tests/` |
| Integration | Vitest + Supertest + MSW | `backend/tests/routes/` |
| E2E | Playwright | `e2e/` |

### Conventions

- **[Unit]** — isolated function, hook, or component test (mocked dependencies)
- **[Integration]** — tests crossing module boundaries (e.g., route → orchestrator)
- **[E2E]** — full browser test against Next.js frontend + mock backend

---

## Flow 1: Build a Shopping List

### 1.1 Add the First Item

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F1.1.1 | Form renders with one empty item row on page load | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |
| F1.1.2 | Item row has a text input for item name | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |
| F1.1.3 | Item row has a quantity input defaulting to 1 | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |
| F1.1.4 | Item row has a brand-specific toggle defaulting to OFF | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |
| F1.1.5 | Typing into item name input updates the shopping list state | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.1.6 | Changing quantity updates the shopping list state | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.1.7 | Toggling brand-specific updates the shopping list state | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |

### 1.2 Add More Items

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F1.2.1 | Clicking "Add Item" adds a new blank item row | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |
| F1.2.2 | `addItem()` hook function appends a new item with default values | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.2.3 | Multiple items can be added and each has independent state | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.2.4 | Each new item gets a unique ID | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.2.5 | User can add multiple items and fill them all out | [E2E] | `e2e/form-interactions.spec.ts` |

### 1.3 Remove an Item

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F1.3.1 | Clicking remove button removes the targeted item | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |
| F1.3.2 | `removeItem(id)` hook function removes item by ID | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.3.3 | Removing all but the last item is allowed; last item row persists | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.3.4 | Remove button is hidden or disabled when only one item remains | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |

### 1.4 Edit an Existing Item

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F1.4.1 | `updateItem(id, changes)` updates item name | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.4.2 | `updateItem(id, changes)` updates quantity | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.4.3 | `updateItem(id, changes)` updates brand-specific toggle | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.4.4 | Editing one item does not affect other items in the list | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |

### 1.5 Duplicate Items

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F1.5.1 | Two items with the same name can coexist in the list | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.5.2 | Duplicate items have distinct IDs | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F1.5.3 | Both duplicates are sent to the backend on search | [E2E] | `e2e/form-interactions.spec.ts` |

---

## Flow 2: Compare Prices (Happy Path)

### 2.1 Submit the Shopping List

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F2.1.1 | Search button is enabled when at least one item has a name | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |
| F2.1.2 | Clicking search sends a POST to `/api/search` with all items | [Unit] | `frontend/tests/lib/api.test.ts` |
| F2.1.3 | Request body contains correct `items` array with id, name, quantity, isBrandSpecific | [Unit] | `frontend/tests/lib/api.test.ts` |
| F2.1.4 | Loading spinner/skeleton appears while request is in flight | [Unit] | `frontend/tests/app/page.test.tsx` |
| F2.1.5 | Loading skeleton shows store column placeholders | [Unit] | `frontend/tests/components/ComparisonSkeleton.test.tsx` |

### 2.2 View Results — Desktop

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F2.2.1 | Results render a column for each store plus Mix & Match | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F2.2.2 | Stores are sorted by total cost (cheapest first) | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F2.2.3 | Cheapest single store column is visually highlighted | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F2.2.4 | Each column shows the store name with correct brand colour | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F2.2.5 | Each item row shows product name, package size, line total (price × quantity) | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F2.2.6 | Each item row shows per-unit cost (e.g., "$1.55 / L") | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F2.2.7 | Column footer shows the store total | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F2.2.8 | Column shows unavailable count when items are missing | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F2.2.9 | Desktop: all store columns visible side-by-side | [E2E] | `e2e/desktop-comparison.spec.ts` |
| F2.2.10 | Full desktop happy path — enter items, compare, verify all columns and totals | [E2E] | `e2e/desktop-comparison.spec.ts` |

### 2.3 View Results — Mobile

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F2.3.1 | Mobile viewport shows tabs instead of columns | [E2E] | `e2e/mobile-comparison.spec.ts` |
| F2.3.2 | Tapping a store tab switches the visible results | [E2E] | `e2e/mobile-comparison.spec.ts` |
| F2.3.3 | Each tab shows item-by-item breakdown identical to desktop column content | [E2E] | `e2e/mobile-comparison.spec.ts` |
| F2.3.4 | No horizontal scrolling required on mobile | [E2E] | `e2e/mobile-comparison.spec.ts` |

### 2.4 Mix & Match Column

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F2.4.1 | Mix & Match column shows the cheapest price for each item across all stores | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F2.4.2 | Each Mix & Match row indicates which store the cheapest price came from | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F2.4.3 | Mix & Match total is the sum of cheapest per-item prices × quantities | [Unit] | `backend/tests/services/result-builder.test.ts` |
| F2.4.4 | Mix & Match tab is accessible on mobile | [E2E] | `e2e/mobile-comparison.spec.ts` |

---

## Flow 3: Brand-Agnostic Item Search

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F3.1 | Brand-agnostic item: Woolworths adapter returns cheapest matching product | [Unit] | `backend/tests/adapters/woolworths.test.ts` |
| F3.2 | Brand-agnostic item: Coles adapter returns cheapest matching product | [Unit] | `backend/tests/adapters/coles.test.ts` |
| F3.3 | Brand-agnostic item: Aldi adapter returns cheapest matching product | [Unit] | `backend/tests/adapters/aldi.test.ts` |
| F3.4 | Brand-agnostic item: Harris Farm adapter returns cheapest matching product | [Unit] | `backend/tests/adapters/harris-farm.test.ts` |
| F3.5 | Orchestrator selects cheapest match for brand-agnostic items (isBrandSpecific=false) | [Unit] | `backend/tests/services/search-orchestrator.test.ts` |
| F3.6 | Results display the matched product name and brand (not the search term) | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F3.7 | Results display the matched package size | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F3.8 | Closest size match is returned if exact size unavailable | [Unit] | `backend/tests/adapters/woolworths.test.ts` |

---

## Flow 4: Brand-Specific Item Search

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F4.1 | Brand-specific item: Woolworths returns the most relevant match | [Unit] | `backend/tests/adapters/woolworths.test.ts` |
| F4.2 | Brand-specific item: Coles returns the most relevant match | [Unit] | `backend/tests/adapters/coles.test.ts` |
| F4.3 | Brand-specific item: Aldi returns the most relevant match | [Unit] | `backend/tests/adapters/aldi.test.ts` |
| F4.4 | Brand-specific item: Harris Farm returns the most relevant match | [Unit] | `backend/tests/adapters/harris-farm.test.ts` |
| F4.5 | Orchestrator uses first/best match for brand-specific items (isBrandSpecific=true) | [Unit] | `backend/tests/services/search-orchestrator.test.ts` |
| F4.6 | When exact product not found, item is marked unavailable (no substitution) | [Unit] | `backend/tests/services/search-orchestrator.test.ts` |

---

## Flow 5: Mixed List (Brand-Agnostic + Brand-Specific)

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F5.1 | Shopping list can contain items with both isBrandSpecific=true and false | [Unit] | `frontend/tests/hooks/useShoppingList.test.ts` |
| F5.2 | API request body correctly represents mixed brand-specific flags | [Unit] | `frontend/tests/lib/api.test.ts` |
| F5.3 | Orchestrator applies correct matching strategy per item based on isBrandSpecific | [Unit] | `backend/tests/services/search-orchestrator.test.ts` |
| F5.4 | Results display all items together per store regardless of match type | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F5.5 | E2E: enter a mixed list, verify brand-specific items show exact match or unavailable | [E2E] | `e2e/desktop-comparison.spec.ts` |

---

## Flow 6: Handle Unavailable Items

### 6.1 Item Unavailable at One or More Stores

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F6.1.1 | Item row shows "unavailable" marker when match is null for a store | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F6.1.2 | Unavailable item is excluded from the store's total | [Unit] | `backend/tests/services/result-builder.test.ts` |
| F6.1.3 | Store column displays unavailable count (e.g., "2 items unavailable") | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F6.1.4 | Other stores that have the item show results normally | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F6.1.5 | Per-store total (`StoreTotal.total`) is the sum of available items only | [Unit] | `backend/tests/services/result-builder.test.ts` |
| F6.1.6 | `StoreTotal.unavailableCount` correctly counts missing items | [Unit] | `backend/tests/services/result-builder.test.ts` |
| F6.1.7 | `StoreTotal.allItemsAvailable` is false when any item is unavailable | [Unit] | `backend/tests/services/result-builder.test.ts` |
| F6.1.8 | E2E: Aldi bread unavailable scenario renders correctly in results | [E2E] | `e2e/desktop-comparison.spec.ts` |

### 6.2 Item Unavailable at All Stores

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F6.2.1 | When no store has a match, all columns show "unavailable" for that item | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F6.2.2 | Mix & Match column shows "unavailable" when no store has the item | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F6.2.3 | Result builder sets `cheapestMatch: null` when all stores return no match | [Unit] | `backend/tests/services/result-builder.test.ts` |
| F6.2.4 | Item contributes $0 to all store totals and Mix & Match total | [Unit] | `backend/tests/services/result-builder.test.ts` |

### 6.3 Null / Missing Price

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F6.3.1 | Woolworths adapter treats null `Price` as unavailable | [Unit] | `backend/tests/adapters/woolworths.test.ts` |
| F6.3.2 | Coles adapter treats null `pricing.now` as unavailable | [Unit] | `backend/tests/adapters/coles.test.ts` |
| F6.3.3 | Aldi adapter treats null `price.amount` as unavailable | [Unit] | `backend/tests/adapters/aldi.test.ts` |
| F6.3.4 | Harris Farm adapter treats null/empty `price` string as unavailable | [Unit] | `backend/tests/adapters/harris-farm.test.ts` |

---

## Flow 7: Handle Store Errors (Partial Degradation)

### 7.1 One Store's API Fails or Times Out

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F7.1.1 | Woolworths adapter throws `StoreApiError` on 5xx response | [Unit] | `backend/tests/adapters/woolworths.test.ts` |
| F7.1.2 | Coles adapter throws `StoreApiError` on 5xx response | [Unit] | `backend/tests/adapters/coles.test.ts` |
| F7.1.3 | Aldi adapter throws `StoreApiError` on 5xx response | [Unit] | `backend/tests/adapters/aldi.test.ts` |
| F7.1.4 | Harris Farm adapter throws `StoreApiError` on 5xx response | [Unit] | `backend/tests/adapters/harris-farm.test.ts` |
| F7.1.5 | Woolworths adapter throws on network error | [Unit] | `backend/tests/adapters/woolworths.test.ts` |
| F7.1.6 | Coles adapter throws on network error | [Unit] | `backend/tests/adapters/coles.test.ts` |
| F7.1.7 | Aldi adapter throws on network error | [Unit] | `backend/tests/adapters/aldi.test.ts` |
| F7.1.8 | Harris Farm adapter throws on network error | [Unit] | `backend/tests/adapters/harris-farm.test.ts` |
| F7.1.9 | Orchestrator uses `Promise.allSettled` — one store failure doesn't block others | [Unit] | `backend/tests/services/search-orchestrator.test.ts` |
| F7.1.10 | When one store fails, its results are omitted; other stores return normally | [Unit] | `backend/tests/services/search-orchestrator.test.ts` |
| F7.1.11 | Frontend shows "temporarily unavailable" for the failed store | [Unit] | `frontend/tests/components/ComparisonResults.test.tsx` |
| F7.1.12 | Mix & Match only considers available stores | [Unit] | `backend/tests/services/result-builder.test.ts` |
| F7.1.13 | E2E: one store returns error, other stores still show results | [E2E] | `e2e/error-states.spec.ts` |

### 7.2 Coles Session / Build ID Stale

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F7.2.1 | Coles session manager fetches buildId from homepage `__NEXT_DATA__` | [Unit] | `backend/tests/adapters/coles-session.test.ts` |
| F7.2.2 | Coles session manager caches session for the configured TTL | [Unit] | `backend/tests/adapters/coles-session.test.ts` |
| F7.2.3 | Coles session manager re-fetches when session is expired | [Unit] | `backend/tests/adapters/coles-session.test.ts` |
| F7.2.4 | Coles adapter retries with fresh session on 404 (stale buildId) | [Unit] | `backend/tests/adapters/coles.test.ts` |
| F7.2.5 | Coles adapter marks store unavailable if retry also fails | [Unit] | `backend/tests/adapters/coles.test.ts` |

### 7.3 All Stores Fail

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F7.3.1 | When all adapters fail, orchestrator returns empty store totals | [Unit] | `backend/tests/services/search-orchestrator.test.ts` |
| F7.3.2 | API route returns a response indicating total failure | [Integration] | `backend/tests/routes/search.test.ts` |
| F7.3.3 | Frontend renders a full-page error message when all stores fail | [Unit] | `frontend/tests/components/ErrorBanner.test.tsx` |
| F7.3.4 | Error state is shown when API returns an error response | [Unit] | `frontend/tests/app/page.test.tsx` |
| F7.3.5 | E2E: API returns error → full error banner shown, no results | [E2E] | `e2e/error-states.spec.ts` |

---

## Flow 8: Empty / Invalid Shopping List

### 8.1 Empty List

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F8.1.1 | Search button is disabled when no items have names | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |
| F8.1.2 | Validation message prompts user to add at least one item | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |
| F8.1.3 | Backend returns 400 when `items` array is empty | [Integration] | `backend/tests/routes/search.test.ts` |
| F8.1.4 | Backend returns 400 when `items` is missing from request body | [Integration] | `backend/tests/routes/search.test.ts` |

### 8.2 Blank Item Name

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F8.2.1 | Items with empty names are filtered out or prevent submission | [Unit] | `frontend/tests/components/ShoppingListForm.test.tsx` |
| F8.2.2 | Backend validates that each item has a non-empty name | [Integration] | `backend/tests/routes/search.test.ts` |

---

## Flow 9: Modify List and Re-Search

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F9.1 | Shopping list form remains visible after results are displayed | [Unit] | `frontend/tests/app/page.test.tsx` |
| F9.2 | User can modify items after results are shown | [Unit] | `frontend/tests/app/page.test.tsx` |
| F9.3 | Clicking search again triggers a new API request | [Unit] | `frontend/tests/app/page.test.tsx` |
| F9.4 | New results replace previous results (no stale data) | [Unit] | `frontend/tests/app/page.test.tsx` |
| F9.5 | Loading spinner appears on re-search | [Unit] | `frontend/tests/app/page.test.tsx` |
| F9.6 | E2E: modify list after initial search, verify updated results | [E2E] | `e2e/form-interactions.spec.ts` |

---

## Flow 10: Use on Mobile While Shopping

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| F10.1 | App renders correctly at 320px width | [E2E] | `e2e/mobile-comparison.spec.ts` |
| F10.2 | Shopping list form is usable with touch-size inputs | [E2E] | `e2e/mobile-comparison.spec.ts` |
| F10.3 | Results display as tabs on mobile viewport | [E2E] | `e2e/mobile-comparison.spec.ts` |
| F10.4 | Switching between store tabs works via tap | [E2E] | `e2e/mobile-comparison.spec.ts` |
| F10.5 | All text is readable without pinch-to-zoom | [E2E] | `e2e/mobile-comparison.spec.ts` |
| F10.6 | No horizontal scroll bar appears on results page | [E2E] | `e2e/mobile-comparison.spec.ts` |
| F10.7 | Full mobile journey: enter items → compare → switch tabs → verify totals | [E2E] | `e2e/mobile-comparison.spec.ts` |

---

## Cross-Cutting: Backend Utilities

These unit tests underpin multiple user flows and are not specific to a single flow.

### Unit Price Calculation

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| U1.1 | `parsePackageSize("500g")` → `{ quantity: 500, unit: "g" }` | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.2 | `parsePackageSize("2L")` → `{ quantity: 2000, unit: "ml" }` (normalised) | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.3 | `parsePackageSize("1.5kg")` → `{ quantity: 1500, unit: "g" }` (normalised) | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.4 | Display unit: small weight (<1kg) → per 100g | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.5 | Display unit: large weight (>=1kg) → per kg | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.6 | Display unit: small volume (<1L) → per 100ml | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.7 | Display unit: large volume (>=1L) → per L | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.8 | Display unit: count-based → per each | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.9 | Normalised price: always per-100g for weight items | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.10 | Normalised price: always per-100ml for volume items | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.11 | Normalised price: null for count-based items | [Unit] | `backend/tests/utils/unit-price.test.ts` |
| U1.12 | Metric units only — no imperial (oz, lb, fl oz) | [Unit] | `backend/tests/utils/unit-price.test.ts` |

### HTTP Client

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| U2.1 | HTTP client sends correct User-Agent header | [Unit] | `backend/tests/utils/http-client.test.ts` |
| U2.2 | HTTP client sends Aldi-specific Origin/Referer headers | [Unit] | `backend/tests/utils/http-client.test.ts` |
| U2.3 | HTTP client respects timeout configuration | [Unit] | `backend/tests/utils/http-client.test.ts` |

### Rate Limiter

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| U3.1 | Rate limiter throttles concurrent requests to same store | [Unit] | `backend/tests/utils/rate-limiter.test.ts` |
| U3.2 | Rate limiter allows requests up to the concurrency limit | [Unit] | `backend/tests/utils/rate-limiter.test.ts` |
| U3.3 | Rate limiter queues excess requests and executes when slots free up | [Unit] | `backend/tests/utils/rate-limiter.test.ts` |

### Shared Type Guards

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| U4.1 | Type guards validate `ShoppingListItem` shape at runtime | [Unit] | `packages/shared/tests/type-guards.test.ts` |
| U4.2 | Type guards reject malformed objects | [Unit] | `packages/shared/tests/type-guards.test.ts` |

---

## Cross-Cutting: API Route Validation

| ID | Test Case | Layer | File |
|----|-----------|-------|------|
| R1.1 | POST `/api/search` with valid body returns 200 | [Integration] | `backend/tests/routes/search.test.ts` |
| R1.2 | POST `/api/search` with empty items returns 400 | [Integration] | `backend/tests/routes/search.test.ts` |
| R1.3 | POST `/api/search` with missing body returns 400 | [Integration] | `backend/tests/routes/search.test.ts` |
| R1.4 | POST `/api/search` with items missing `name` returns 400 | [Integration] | `backend/tests/routes/search.test.ts` |
| R1.5 | CORS headers are present on response | [Integration] | `backend/tests/routes/search.test.ts` |
| R1.6 | OPTIONS preflight returns correct CORS headers | [Integration] | `backend/tests/routes/search.test.ts` |
| R1.7 | Non-POST methods return 404 or 405 | [Integration] | `backend/tests/routes/search.test.ts` |

---

## Test Count Summary

| Flow | Unit | Integration | E2E | Total |
|------|------|-------------|-----|-------|
| Flow 1: Build Shopping List | 15 | 0 | 2 | 17 |
| Flow 2: Compare Prices (Happy Path) | 13 | 0 | 5 | 18 |
| Flow 3: Brand-Agnostic Search | 8 | 0 | 0 | 8 |
| Flow 4: Brand-Specific Search | 6 | 0 | 0 | 6 |
| Flow 5: Mixed List | 4 | 0 | 1 | 5 |
| Flow 6: Unavailable Items | 14 | 0 | 1 | 15 |
| Flow 7: Store Errors | 16 | 1 | 2 | 19 |
| Flow 8: Empty/Invalid List | 4 | 2 | 0 | 6 |
| Flow 9: Modify & Re-Search | 5 | 0 | 1 | 6 |
| Flow 10: Mobile | 0 | 0 | 7 | 7 |
| Cross-Cutting: Utilities | 18 | 0 | 0 | 18 |
| Cross-Cutting: API Route | 0 | 7 | 0 | 7 |
| **Total** | **103** | **10** | **19** | **132** |

---

## Execution

### Running Tests

```bash
# All unit tests (backend)
npm test --workspace=backend

# All unit tests (frontend)
npm test --workspace=frontend

# Shared package tests
npm test --workspace=@grocery/shared

# E2E tests (requires frontend + mock server)
npx playwright test

# Single E2E file
npx playwright test e2e/desktop-comparison.spec.ts
```

### Test Data Strategy

| Data Source | Where Used | Notes |
|-------------|------------|-------|
| JSON fixture files (`backend/tests/fixtures/*.json`) | Backend adapter tests | Real API responses captured during investigation |
| Typed fixture objects (`frontend/tests/fixtures/`) | Frontend component tests | `mockComparisonResponse` with typed overrides |
| Builder functions (`backend/tests/helpers/data-builders.ts`) | Backend service tests | `makeMatch()`, `makeSearchResult()` with `Partial<T>` overrides |
| E2E fixture builders (`e2e/fixtures/comparison-response.ts`) | E2E mock server | `makeProduct()`, `makeStoreItem()`, `makeStoreTotal()`, `makeMixItem()` |
| MSW server handlers | Both frontend and backend unit tests | Per-test `server.use(http.get/post(...))` |
| Playwright `page.route()` intercepts | E2E error state tests | Override mock server responses for specific scenarios |
