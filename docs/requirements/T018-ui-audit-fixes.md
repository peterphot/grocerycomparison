# T018 UI Audit & User Flow Fixes - Requirements

## Status: IN PROGRESS

## Source
- Ticket: `docs/tickets/backlog/T018-ui-audit-fixes.md`
- Chrome DevTools + Pencil design audit

## Requirements

### R1: Error Propagation (B3 - covers B1, B2)
- SearchOrchestrator must preserve per-store error details when adapters fail
- ComparisonResponse type must include optional `storeErrors` map
- Frontend must display "Store: connection error" instead of "$0.00" when an adapter fails
- **Acceptance Criteria**: When an adapter throws, the response includes the error message and the frontend shows a meaningful error state for that store

### R2: Mix & Match Algorithm Alignment (B4)
- Mix & Match must use absolute price comparison (same as store columns)
- Remove unitPriceNormalised-based comparison from buildMixAndMatch()
- **Acceptance Criteria**: Mix & Match always picks the cheapest absolute-price item per shopping list entry

### R3: Fixed Store Order (F6)
- Store columns/tabs always show in order: Woolworths, Coles, Aldi, Harris Farm, Mix & Match
- Remove price-based sorting from buildStoreTotals()
- **Acceptance Criteria**: Store order is deterministic and matches the design regardless of prices

### R4: Frontend Display Fixes (F1, F2, F3, F5, F8, F9)
- F1: Add spacing between product name and price in ItemRow
- F2: Show quantity badges on ALL items (not just qty > 1)
- F3: Purple border on Mix & Match column (desktop) -- ALREADY DONE (verified in MixAndMatchColumn.tsx)
- F5: Purple "Mix $X" pill button on mobile summary bar that switches to Mix & Match tab
- F8: Store source indicators on Mix & Match items (small colored badge showing source store)
- F9: Normalize unit measures to consistent lowercase (100g not 100G) in Woolworths adapter
- **Acceptance Criteria**: Each fix matches the Pencil design

### R5: Save with Mix & Match CTA (F4)
- Show "Save $X with Mix & Match" as a clickable link
- Desktop: scrolls to Mix & Match column
- Mobile: switches to Mix & Match tab
- Only show when Mix & Match is actually cheaper than cheapest single store
- **Acceptance Criteria**: CTA appears when savings exist; clicking navigates to Mix & Match

### R6: Mobile Default Tab (F7)
- Mobile results should auto-select the cheapest store tab (the one with "cheapest store" badge)
- **Acceptance Criteria**: On mobile, the default active tab is the cheapest store

### R7: Remove Help Link (UX1)
- Remove the Help link from the Header component
- **Acceptance Criteria**: No Help link visible in the header

### R8: Form Accessibility (A1)
- Add id and name attributes to all form fields
- **Acceptance Criteria**: No console warnings about missing id/name attributes

### R9: Favicon (M1)
- Add SVG favicon with brand color #16A34A
- **Acceptance Criteria**: No 404 for /favicon.ico, favicon visible in browser tab

## Edge Cases
- All adapters fail: show "No results found" with error details per store
- Mix & Match total equals cheapest store: don't show savings CTA
- Only one store returns results: still show all columns, others show error/unavailable
- Mobile with no results: show appropriate empty/error state

## In Scope / Out of Scope

### In Scope
- B3: Error propagation from orchestrator to frontend
- B4: Mix & Match algorithm fix
- F1-F9: All frontend display fixes (F3 already done)
- UX1: Remove Help link
- A1: Form field accessibility
- M1: Favicon
- M2: Verify existing handling (no code change needed)

### Out of Scope
- B1/B2: Fixing actual Coles/Aldi API calls (external API changes)
- New features not in the ticket
- E2E test updates (unit tests only for this ticket)
