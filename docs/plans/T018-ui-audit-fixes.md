# T018 UI Audit & User Flow Fixes - Plan

## Task Breakdown

### Task 1: Backend - Error propagation (B3) + Store order (F6)
**Issues**: B3, F6
**Files**:
- `packages/shared/src/types/comparison.ts` - Add `storeErrors` to ComparisonResponse
- `backend/src/services/search-orchestrator.ts` - Capture and propagate adapter errors
- `backend/src/services/result-builder.ts` - Remove price-based sorting, use fixed order
- `backend/tests/services/search-orchestrator.test.ts` - Test error propagation
- `backend/tests/services/result-builder.test.ts` - Test fixed order

### Task 2: Backend - Mix & Match algorithm fix (B4)
**Issues**: B4
**Files**:
- `backend/src/services/result-builder.ts` - Change buildMixAndMatch to use absolute price
- `backend/tests/services/result-builder.test.ts` - Test absolute price comparison

### Task 3: Backend - Unit measure normalization (F9)
**Issues**: F9
**Files**:
- `backend/src/adapters/woolworths.ts` - Normalize CupMeasure to lowercase
- `backend/tests/adapters/woolworths.test.ts` - Test normalization

### Task 4: Frontend - ItemRow fixes (F1, F2, F8)
**Issues**: F1, F2, F8
**Files**:
- `frontend/src/components/results/ItemRow.tsx` - Fix spacing, always show qty badge, add store source
- `frontend/tests/components/ItemRow.test.tsx` - New test file for ItemRow

### Task 5: Frontend - ComparisonResults fixes (F4, F5, F7, store order)
**Issues**: F4, F5, F7, F6 (frontend side)
**Files**:
- `frontend/src/components/results/ComparisonResults.tsx` - Fixed order, default tab, save CTA, Mix pill
- `frontend/tests/components/ComparisonResults.test.tsx` - Update existing tests

### Task 6: Frontend - Header, form accessibility, favicon (UX1, A1, M1)
**Issues**: UX1, A1, M1
**Files**:
- `frontend/src/components/common/Header.tsx` - Remove Help link
- `frontend/src/components/shopping-list/ShoppingListItem.tsx` - Add id/name attrs
- `frontend/src/app/layout.tsx` or `public/` - Add favicon
- Frontend tests for header and form fields

### Task 7: Frontend - Store error display
**Issues**: B3 (frontend side)
**Files**:
- `frontend/src/components/results/StoreColumn.tsx` - Show error state when store has error
- `frontend/src/components/results/ComparisonResults.tsx` - Pass storeErrors through
- Frontend tests for error display

## Dependencies
- Task 1 must complete before Task 7 (shared types change)
- Task 2 must complete before Task 5 (savings calculation depends on correct Mix & Match)
- Tasks 3, 4, 6 are independent
