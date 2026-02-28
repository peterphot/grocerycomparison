# T002 — Shared Types Package

## Status
- [x] Backlog
- [ ] In Progress
- [ ] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: T001
- **Blocks**: T003, T008, T012
- **Parallel with**: T011 (T011 only needs T001)

---

## Summary

Define all shared TypeScript types and runtime type guards used by both the backend and frontend.
This package is the contract between layers — every other package imports from here.

## Source
- `plan.md` → T002, T003, Section 4 (Data Model / Types)

---

## Acceptance Criteria

- [ ] `packages/shared/src/types/shopping-list.ts` exports `ShoppingListItem`, `ShoppingList`
- [ ] `packages/shared/src/types/product.ts` exports `StoreName`, `ProductMatch`, `ItemSearchResult`
- [ ] `packages/shared/src/types/comparison.ts` exports `StoreTotal`, `StoreItemResult`, `MixAndMatchResult`, `MixAndMatchItem`, `ComparisonResponse`
- [ ] `packages/shared/src/types/errors.ts` exports `StoreApiError` (backend) and `ApiError` (frontend) classes
- [ ] `packages/shared/src/types/index.ts` re-exports everything
- [ ] Type guard functions exist for runtime validation: `isShoppingListItem`, `isProductMatch`, `isComparisonResponse`
- [ ] All types compile with `strict: true`, no `any`
- [ ] Unit tests confirm type guards accept valid data and reject invalid data
- [ ] Both `backend/` and `frontend/` can import from `@grocery/shared`

---

## TDD Requirements

- [ ] Write type guard tests FIRST in `packages/shared/tests/`
- [ ] Tests must fail (type guards don't exist yet)
- [ ] Implement types and type guards to make tests pass
- [ ] Test every type guard with: valid input, missing required field, wrong field type

---

## Test Plan

```typescript
// packages/shared/tests/type-guards.test.ts

describe('isShoppingListItem', () => {
  it('accepts valid item', () => { ... })
  it('rejects missing id', () => { ... })
  it('rejects missing name', () => { ... })
  it('rejects non-boolean isBrandSpecific', () => { ... })
})

describe('isProductMatch', () => {
  it('accepts valid match with null unitPrice', () => { ... })
  it('rejects unknown store name', () => { ... })
  it('rejects negative price', () => { ... })
})

describe('isComparisonResponse', () => {
  it('accepts valid response', () => { ... })
  it('rejects missing storeTotals', () => { ... })
  it('rejects missing mixAndMatch', () => { ... })
})
```

---

## Error Type Definitions

```typescript
// packages/shared/src/types/errors.ts

/** Thrown by store adapters when an API call fails */
export class StoreApiError extends Error {
  constructor(
    message: string,
    public readonly store: StoreName,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false,
  ) {
    super(message);
    this.name = 'StoreApiError';
  }
}

/** Thrown by the frontend API client on non-2xx responses */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

Retryable errors: 5xx status codes and network/timeout errors.
Non-retryable: 4xx (bad request, not found).

---

## Implementation Notes

All types are defined verbatim from `plan.md` Section 4. Key notes:

- `StoreName` is a union type: `"woolworths" | "coles" | "aldi" | "harrisfarm"`
- `unitPrice`, `unitMeasure`, `unitPriceNormalised` are `number | null` — stores that can't compute unit price set these to null
- `ProductMatch.price` is always in dollars (floats), regardless of source format — adapters normalise before returning
- Type guards use duck typing (check field existence + typeof) — no Zod dependency to keep the shared package lean

---

## Files to Create

| File | Description |
|------|-------------|
| `packages/shared/src/types/shopping-list.ts` | `ShoppingListItem`, `ShoppingList` |
| `packages/shared/src/types/product.ts` | `StoreName`, `ProductMatch`, `ItemSearchResult` |
| `packages/shared/src/types/comparison.ts` | `StoreTotal`, `StoreItemResult`, `MixAndMatchResult`, `MixAndMatchItem`, `ComparisonResponse` |
| `packages/shared/src/types/errors.ts` | `StoreApiError`, `ApiError` |
| `packages/shared/src/types/index.ts` | Re-exports all types |
| `packages/shared/src/guards/index.ts` | Runtime type guard functions |
| `packages/shared/tests/type-guards.test.ts` | Type guard unit tests |
