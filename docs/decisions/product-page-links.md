# Decisions: Product Page Links

## Summary
This document records all decisions made during the product-page-links feature implementation.

## Key Decisions

### D-CLARIFY-001: Search URL fallback for stores without direct product pages
- **Who**: User
- **Decision**: Use search results page URLs for Woolworths and Aldi
- **Rationale**: Ensures every product has a clickable link

### D-CLARIFY-002: Coles direct product URL construction
- **Who**: User
- **Decision**: Construct URLs as `coles.com.au/product/<slugified-name>-<id>`
- **Rationale**: Coles usually redirects even if slug doesn't match exactly

### D-CLARIFY-003: Product name as clickable link with external icon
- **Who**: User
- **Decision**: Make product name the clickable element with subtle ExternalLink icon
- **Rationale**: Clean integration with existing UI

### D-CLARIFY-004: Mix & Match items should also be linkable
- **Who**: User
- **Decision**: Links work in Mix & Match column using the source store's URL
- **Rationale**: Consistency with store columns

### D-CLARIFY-005: Harris Farm direct URL via Shopify handle
- **Who**: User
- **Decision**: Use `harrisfarm.com.au/products/<handle>` for direct product links
- **Rationale**: Shopify provides stable product handles

### D-ORCH-001: SMALL scale assessment
- **Who**: Claude
- **Decision**: 4 tasks, STANDARD sequential pattern
- **Rationale**: Well-scoped feature adding one field across the stack

## Technical Implementation

### URL Generation Strategy
| Store | Strategy | URL Pattern |
|-------|----------|-------------|
| Woolworths | Search URL (fallback) | `woolworths.com.au/shop/search/products?searchTerm={name}` |
| Coles | Direct product URL | `coles.com.au/product/{slug}-{id}` |
| Aldi | Search URL (fallback) | `aldi.com.au/en/search/?text={name}` |
| Harris Farm | Direct Shopify URL | `harrisfarm.com.au/products/{handle}` |

### Coles Slug Generation
Simple slugify function: lowercase, replace non-alphanumeric with hyphens, collapse consecutive hyphens, trim.

### Frontend Rendering
- `ItemRow` component conditionally renders `<a>` or `<p>` based on `productUrl` presence
- External link icon (12px) from lucide-react appears alongside linked product names
- Hover state: green text + underline for visual feedback
- Opens in new tab with `rel="noopener noreferrer"` for security
