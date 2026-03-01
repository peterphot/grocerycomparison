# Decision Log: product-page-links
_Initialized: 2026-03-01T12:00:00Z_

## Clarify Phase
_Captured: 2026-03-01T12:00:00Z_

### D-CLARIFY-001: Search URL fallback for stores without direct product pages
- **Who decided**: user
- **What**: Use search results page URLs for Woolworths and Aldi where direct product URLs are not available
- **Why**: Ensures every product has a clickable link, even when the store API doesn't return a direct product page URL
- **Alternatives**: Omit link entirely for those stores; try to reverse-engineer product page URLs
- **Context**: Woolworths API returns no slug/ID for product pages, Aldi AU has no standard product page URLs

### D-CLARIFY-002: Coles direct product URL construction
- **Who decided**: user
- **What**: Construct Coles product URLs as `coles.com.au/product/<slugified-name>-<id>` (best effort)
- **Why**: Coles usually redirects to the correct product page even if the slug doesn't match exactly
- **Alternatives**: Link to Coles search page instead; omit link
- **Context**: Coles API returns `id` and `name` but no slug; slug can be derived from name

### D-CLARIFY-003: Product name as clickable link with external icon
- **Who decided**: user
- **What**: Make the product name the clickable element, with a subtle external link icon
- **Why**: Clean integration with existing UI; product name is the natural click target
- **Alternatives**: Separate "View" button; icon-only button; entire row clickable
- **Context**: Asked about link styling preferences for the ItemRow component

### D-CLARIFY-004: Mix & Match items should also be linkable
- **Who decided**: user
- **What**: Mix & Match column items link to the product page on whichever store they came from
- **Why**: Consistency; users viewing Mix & Match results need to navigate to the correct store
- **Alternatives**: No links in Mix & Match column
- **Context**: Mix & Match items already show a store source badge; links should follow the same store

### D-CLARIFY-005: Harris Farm direct URL via Shopify handle
- **Who decided**: user
- **What**: Use `harrisfarm.com.au/products/<handle>` for Harris Farm product URLs
- **Why**: Harris Farm uses Shopify which provides stable product handles in the suggest API
- **Alternatives**: Search URL fallback
- **Context**: Harris Farm API returns `handle` field which maps directly to Shopify product pages

## Orchestrate Phase
_Captured: 2026-03-01T12:00:00Z_

### D-ORCH-001: SMALL scale assessment
- **Who decided**: claude
- **What**: Assessed feature as SMALL scale (4 tasks)
- **Why**: The feature is a well-scoped addition: add one field to a shared type, update 4 adapters (similar changes), update one frontend component. No architectural changes, no new pages or routes.
- **Alternatives**: MEDIUM (would overestimate; changes are mechanical across adapters)
- **Context**: Scale assessment for product page links feature

### D-ORCH-002: STANDARD sequential orchestration pattern
- **Who decided**: claude
- **What**: Use STANDARD sequential pattern
- **Why**: Tasks have natural dependencies (shared type first, then adapters, then frontend). Only 4 tasks, too few to benefit from parallelism.
- **Alternatives**: PARALLEL (adapter tasks could technically run in parallel but share the type change)
- **Context**: Selecting orchestration pattern for a small feature
