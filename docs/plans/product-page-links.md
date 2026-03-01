# Plan: Product Page Links

## Summary
Add `productUrl` field to the shared `ProductMatch` type, update all 4 backend adapters to populate it, and update the frontend `ItemRow` component to render product names as external links.

## Architecture Impact
- **Shared types** (`packages/shared/src/types/product.ts`): Add `productUrl: string | null` to `ProductMatch`
- **Type guard** (`packages/shared/src/guards/index.ts`): Update `isProductMatch` to validate `productUrl`
- **Backend adapters** (4 files): Each adapter's `mapProduct` method populates `productUrl`
- **Test fixtures** (4 JSON files): Add URL-related fields where applicable
- **Frontend component** (`ItemRow.tsx`): Render product name as `<a>` link with external icon
- **Frontend tests**: Update to verify link rendering

## Task Breakdown

### [T001] Shared type + type guard: add `productUrl` to `ProductMatch`
- **Type**: Implement (with tests)
- **Files**:
  - `packages/shared/src/types/product.ts` - Add `productUrl: string | null`
  - `packages/shared/src/guards/index.ts` - Update `isProductMatch`
  - `packages/shared/tests/type-guards.test.ts` - Test new field validation
- **Dependencies**: None

### [T002] Backend adapters: populate `productUrl` in all 4 adapters
- **Type**: Implement (with tests)
- **Files**:
  - `backend/src/adapters/woolworths.ts` - Search URL from product name
  - `backend/src/adapters/coles.ts` - Direct product URL from slugified name + id
  - `backend/src/adapters/aldi.ts` - Search URL from product name
  - `backend/src/adapters/harris-farm.ts` - Direct Shopify URL from handle
  - `backend/tests/fixtures/woolworths-milk.json` - No change needed (URL constructed from name)
  - `backend/tests/fixtures/coles-milk.json` - Already has `id` field
  - `backend/tests/fixtures/aldi-milk.json` - Already has `sku` field
  - `backend/tests/fixtures/harrisfarm-milk.json` - Already has `handle` field
  - `backend/tests/adapters/woolworths.test.ts` - Test URL generation
  - `backend/tests/adapters/coles.test.ts` - Test URL generation with slug
  - `backend/tests/adapters/aldi.test.ts` - Test URL generation
  - `backend/tests/adapters/harris-farm.test.ts` - Test URL generation
- **Dependencies**: T001

### [T003] Frontend: render product links in `ItemRow`
- **Type**: Implement (with tests)
- **Files**:
  - `frontend/src/components/results/ItemRow.tsx` - Wrap product name in `<a>` tag, add ExternalLink icon
  - `frontend/tests/components/ComparisonResults.test.tsx` - Test link rendering
  - `frontend/tests/fixtures/comparison-response.ts` - Add `productUrl` to fixture data
- **Dependencies**: T001

### [T004] Documentation and cleanup
- **Type**: Document
- **Files**:
  - `docs/requirements/product-page-links.md` - Mark as COMPLETED
  - `docs/decisions/product-page-links.md` - Final decision summary
- **Dependencies**: T001, T002, T003

## URL Patterns

| Store | URL Pattern | Data Source |
|-------|-------------|-------------|
| Woolworths | `https://www.woolworths.com.au/shop/search/products?searchTerm={encodedName}` | `DisplayName` |
| Coles | `https://www.coles.com.au/product/{slug}-{id}` | `name` (slugified) + `id` |
| Aldi | `https://www.aldi.com.au/en/search/?text={encodedName}` | `name` |
| Harris Farm | `https://www.harrisfarm.com.au/products/{handle}` | `handle` |

## Coles Slug Generation
- Lowercase the name
- Replace non-alphanumeric characters with hyphens
- Collapse multiple hyphens
- Trim leading/trailing hyphens
- Example: "Full Cream Milk" -> "full-cream-milk" -> URL: `/product/full-cream-milk-8150288`
