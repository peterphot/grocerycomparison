# T018 — UI Audit & User Flow Fixes

**Created**: 2026-03-01
**Priority**: High
**Source**: Chrome DevTools + Pencil design audit

---

## Summary

Full UI audit comparing the live app (localhost:3000/4000) against the Pencil design file (`designs.pen`, screens nsAxf/Nhqcs/J0F1G/xOuKy). Found 16 issues across backend adapters, frontend display, design alignment, and accessibility.

---

## Critical Issues (Backend)

### B1. Coles adapter returns zero results for all items
**Severity**: Critical
**File**: `backend/src/adapters/coles.ts`, `backend/src/utils/coles-session.ts`
**Evidence**: API response shows `match: null` for all 3 test items (Milk 2L, Vegemite 380g, Bread wholemeal). Coles column shows $0.00 total with "3 items unavailable".
**Root Cause**: The `ColesSessionManager.ensureSession()` likely fails to extract a valid `buildId` from the Coles homepage (HTML structure may have changed). The SearchOrchestrator silently converts adapter rejections to empty arrays (line 66 of `search-orchestrator.ts`: `r.status === 'fulfilled' ? r.value : []`).
**Fix**: (1) Verify Coles buildId regex still matches current site. (2) Add error logging to surface adapter failures instead of silently swallowing them.

### B2. Aldi adapter returns zero results for all items
**Severity**: Critical
**File**: `backend/src/adapters/aldi.ts`
**Evidence**: Same as B1 — all items return `match: null`. Aldi column shows $0.00 / "3 items unavailable".
**Root Cause**: The Aldi REST API (`api.aldi.com.au/v3/product-search`) may be rate-limiting, geo-blocking, or rejecting requests. Errors are silently caught by the same orchestrator pattern.
**Fix**: (1) Test Aldi API endpoint directly via curl. (2) Add logging. (3) Consider adding proper error state to the UI when adapters fail.

### B3. SearchOrchestrator silently swallows adapter errors
**Severity**: High
**File**: `backend/src/services/search-orchestrator.ts` (line 66)
**Evidence**: When any adapter throws (StoreApiError, network error, timeout), `Promise.allSettled` catches it and the orchestrator converts it to `[]` — making failures indistinguishable from "no products found".
**Fix**: Preserve error details per-store and return them in the API response so the frontend can display "Coles: connection error" instead of "$0.00".

### B4. Mix & Match selects different (more expensive) products than individual store columns
**Severity**: High
**File**: `backend/src/services/result-builder.ts` (lines 59-94)
**Evidence**: Harris Farm column shows "Peace Bakery Wholemeal Lebanese Bread x7" at $1.99, but Mix & Match picks "Harris Farm Sliced Wholemeal Bread 700g" at $2.99. Mix & Match total ($13.79) exceeds cheapest single store ($12.70 Woolworths).
**Root Cause**: Individual store selection uses `cheapestAvailableMatch()` which compares by **absolute price**. Mix & Match uses `buildMixAndMatch()` which compares by **`unitPriceNormalised`** (per-100g/100ml) when available. A larger pack at $2.99 with better per-unit cost beats a smaller $1.99 pack.
**Fix**: Either (a) align both algorithms to use the same comparison metric, or (b) clearly communicate that Mix & Match optimizes by unit price, not total cost. Option (a) is recommended since users expect lowest total spend.

---

## UI / Design Alignment Issues (Frontend)

### F1. Price and product name concatenation on desktop results
**Severity**: Medium
**File**: `frontend/src/components/results/ItemRow.tsx` (lines 24-47)
**Evidence**: In narrow desktop columns, "Vegemite$7.70" and "Woolworths$3.2" appear concatenated without spacing between product name and price.
**Design**: Product name and price have clear separation with whitespace.
**Fix**: Ensure minimum gap or explicit spacing between the name div and price div in the flex layout.

### F2. Missing quantity badges on result items
**Severity**: Low
**File**: `frontend/src/components/results/ItemRow.tsx` (line 36)
**Evidence**: Design shows "qty 1", "qty 2" badges next to every item price. Live app only shows quantity badges when `quantity > 1`.
**Design**: All items show quantity badges (nsAxf/Nhqcs designs).
**Fix**: Change condition from `quantity > 1` to always show, or show for all items when any item has qty > 1.

### F3. Missing purple border on Mix & Match column (desktop)
**Severity**: Low
**Evidence**: Design (Nhqcs) shows the Mix & Match column with a purple border/outline. Live app has purple header but no column border.
**Fix**: Add `border-2 border-purple-500` (or similar) to the Mix & Match column wrapper on desktop.

### F4. Missing "Save $X with Mix & Match" link
**Severity**: Medium
**Evidence**: Design shows "Save $3.63 with mix & match →" at top-right (desktop) and as a footer link (mobile: "Save $1.63 more with Mix & Match →"). Live app has neither.
**Fix**: Calculate savings = cheapest single store total - mix & match total. Display as a link/CTA when mix & match is cheaper. Note: currently mix & match is MORE expensive due to B4, so this will need B4 fixed first.

### F5. Missing "Mix $X" shortcut pill on mobile summary bar
**Severity**: Low
**Evidence**: Design (xOuKy) shows a purple "Mix $15.17" pill button in the mobile summary bar that presumably switches to the Mix & Match tab. Live app only has text "Best mix & match: $13.79".
**Fix**: Add a clickable purple pill that navigates to the Mix & Match tab.

### F6. Store column/tab order differs from design
**Severity**: Medium
**Evidence**: Design shows fixed order: Woolworths, Coles, Aldi, Harris Farm, Mix & Match. Live app shows: Harris Farm, Woolworths, Coles, Aldi, Mix & Match (appears sorted by total price ascending).
**Fix**: Use fixed store order matching the design, or sort so cheapest-with-results comes first (excluding $0.00 stores with zero availability).

### F7. Mobile results default tab should be cheapest store
**Severity**: Medium
**Evidence**: Mobile results default to first tab (Harris Farm at $5.09). Should default to cheapest single store (Woolworths at $12.70 — the one with all items available). Harris Farm has 1 item unavailable, so it's misleading to show it as "cheapest" at $5.09.
**Fix**: Auto-select the tab for the store marked as "cheapest store" (the one with the badge).

### F8. Missing store source indicators on Mix & Match items
**Severity**: Low
**Evidence**: Design (Nhqcs/xOuKy) shows small colored store badges or indicators on each item in Mix & Match to identify which store it comes from. Live app shows only the product name without store attribution.
**Fix**: Add a small store name badge or colored indicator next to each Mix & Match item showing its source store.

### F9. Unit measure case inconsistency ("100G" vs "100g")
**Severity**: Low
**File**: `backend/src/utils/unit-price.ts` (line 52), adapter response passthrough
**Evidence**: Woolworths items show "$2.03 / 100G" (uppercase G from Woolworths API) while locally computed values show "100g" (lowercase from unit-price.ts). Mix & Match bread shows "$0.43 / 100g" (lowercase).
**Fix**: Normalize unit measures to consistent lowercase (e.g., "100g", "kg", "L") at the adapter level before returning.

---

## User Flow Issues

### UX1. Help link is non-functional
**Severity**: Medium
**Evidence**: Clicking "Help" navigates to `#help` anchor but no help section/modal exists. Nothing visible happens.
**Fix**: Either (a) implement a help section/modal, or (b) remove the Help link until it's implemented.

---

## Accessibility Issues

### A1. Form fields missing id/name attributes
**Severity**: Medium
**Evidence**: Console warning: "A form field element should have an id or name attribute" (6 instances). All item input fields and quantity spinbuttons lack id/name.
**Fix**: Add unique `id` and `name` attributes to each form field (e.g., `item-0`, `qty-0`, etc.).

---

## Minor Issues

### M1. Missing favicon
**Severity**: Low
**Evidence**: Console 404 error for `/favicon.ico`.
**Fix**: Add a favicon file (e.g., a green shopping cart icon matching the brand).

### M2. Harris Farm bread item missing unit price
**Severity**: Low
**Evidence**: "Peace Bakery Wholemeal Lebanese Bread x7" from Harris Farm returns `packageSize: ""`, `unitPrice: null`, `unitMeasure: null`. No unit price displayed.
**Root Cause**: Harris Farm Shopify API likely doesn't provide package size for this product.
**Fix**: This is a data quality issue from the source API. Consider showing "unit price not available" or omitting the unit price row gracefully (already handled by conditional rendering).

---

## Issue Summary Table

| ID  | Severity | Category     | Description                                          |
|-----|----------|-------------|------------------------------------------------------|
| B1  | Critical | Backend     | Coles adapter returns zero results                    |
| B2  | Critical | Backend     | Aldi adapter returns zero results                     |
| B3  | High     | Backend     | Orchestrator silently swallows adapter errors         |
| B4  | High     | Backend     | Mix & Match uses different algorithm than store cols  |
| F1  | Medium   | Frontend    | Price/name concatenation without spacing              |
| F2  | Low      | Frontend    | Missing quantity badges                               |
| F3  | Low      | Frontend    | Missing purple border on Mix & Match column           |
| F4  | Medium   | Frontend    | Missing "Save $X with Mix & Match" link               |
| F5  | Low      | Frontend    | Missing "Mix $X" pill on mobile summary               |
| F6  | Medium   | Frontend    | Store column/tab order differs from design            |
| F7  | Medium   | Frontend    | Default tab should be cheapest store                  |
| F8  | Low      | Frontend    | Missing store source indicators on Mix & Match        |
| F9  | Low      | Backend     | Unit measure case inconsistency                       |
| UX1 | Medium   | UX          | Help link non-functional                              |
| A1  | Medium   | Accessibility| Form fields missing id/name attributes               |
| M1  | Low      | Minor       | Missing favicon                                       |
| M2  | Low      | Minor       | Harris Farm bread missing unit price data             |

**Total: 17 issues** (2 Critical, 2 High, 6 Medium, 7 Low)
