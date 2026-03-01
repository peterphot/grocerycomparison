# Requirements: Product Page Links

## Summary
Add clickable product page links to comparison results so users can navigate directly to a product's page on the respective store's website.

## User Stories

### US1: Product Link in Store Columns
**As a** shopper viewing comparison results,
**I want** each product name in the store columns to be a clickable link to the product's page on that store's website,
**So that** I can quickly navigate to buy the product.

**Acceptance Criteria:**
- Each product name in store columns is rendered as a clickable link
- Clicking opens the product page in a new browser tab
- A subtle external link icon appears alongside the product name
- The link is visually unobtrusive (does not disrupt the existing layout)

### US2: Product Link in Mix & Match Column
**As a** shopper viewing the Mix & Match column,
**I want** each product name to link to the product page on whichever store it came from,
**So that** I can navigate to buy the cheapest option from the correct store.

**Acceptance Criteria:**
- Mix & Match items link to the correct store's product page
- Same new-tab behavior and external link icon as store columns

### US3: Product URL from Backend
**As a** frontend consumer of the comparison API,
**I want** the backend to return a `productUrl` field in each `ProductMatch`,
**So that** the frontend can render it as a link without constructing URLs client-side.

**Acceptance Criteria:**
- `ProductMatch` type includes an optional `productUrl` field (`string | null`)
- Each adapter populates `productUrl` with the best available URL for that store
- URL patterns per store:
  - **Woolworths**: `https://www.woolworths.com.au/shop/search/products?searchTerm=<encoded product name>` (search URL fallback)
  - **Coles**: `https://www.coles.com.au/product/<slugified-name>-<id>` (direct product URL, best effort)
  - **Aldi**: `https://www.aldi.com.au/en/search/?text=<encoded product name>` (search URL fallback)
  - **Harris Farm**: `https://www.harrisfarm.com.au/products/<handle>` (direct product URL via Shopify handle)

## Edge Cases
- If a product has no URL data (e.g., missing handle/id), `productUrl` should be `null` and no link is rendered
- Unavailable products (match is null) have no link (already rendered as "Not available")
- Product names with special characters must be properly URL-encoded
- Coles slug generation from name should handle edge cases (extra spaces, special characters)

## In Scope / Out of Scope

### In Scope
- Adding `productUrl` field to `ProductMatch` shared type
- Updating all 4 backend adapters to populate `productUrl`
- Updating `ItemRow` component to render product name as a link
- Adding external link icon (lucide-react `ExternalLink`)
- Updating existing tests and adding new tests for URL generation
- Updating type guard for `ProductMatch`

### Out of Scope
- Deep linking to specific product variants
- Affiliate link tracking or URL parameters
- Verifying that generated URLs actually resolve (best effort)
- Changing the visual design of the results grid beyond adding link styling
- URL shortening or caching

## Status: COMPLETED
