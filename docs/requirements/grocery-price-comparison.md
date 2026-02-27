# Requirements: Grocery Price Comparison Web App

Status: IN_PROGRESS

## Overview

A web application that allows users to enter a shopping list and compare prices across Australian supermarkets. The app finds:
1. The cheapest single store to complete all shopping
2. The cheapest total by mixing and matching across stores

## User Stories

### US1: Shopping List Entry
As a user, I want to enter a structured shopping list with item names, quantities, and optional brand preferences so I can compare prices for my specific needs.

**Acceptance Criteria:**
- Structured form with fields for: item name, quantity, brand preference (optional)
- Quantities supported (e.g., "3x milk 2L")
- Items can be brand-agnostic (find cheapest) or brand-specific (find that product)
- Both types can appear in the same list
- List can be modified (add, remove, edit items) before searching

### US2: Multi-Store Price Comparison
As a user, I want to see prices for my shopping list across Woolworths, Coles, Aldi, and Harris Farm so I can find the cheapest option.

**Acceptance Criteria:**
- Searches all 4 stores: Woolworths, Coles, Aldi, Harris Farm
- Shows total cost per store with item-by-item breakdown
- Shows mix-and-match list (cheapest per item across all stores) side by side with per-store lists
- Items not available at a store are marked "unavailable"
- Unavailable items are excluded from that store's total (store total only reflects available items)

### US3: Brand-Agnostic Matching
As a user, when I enter a generic item like "milk 2L", I want the app to find the cheapest product matching that description regardless of brand.

**Acceptance Criteria:**
- Searches for the item term and returns the cheapest match
- Matches closest available size (e.g., if 2L not available, 1.5L or 3L may be shown)
- Shows the matched product name and brand in results so user knows what they're getting

### US4: Brand-Specific Matching
As a user, when I enter a branded item like "Vegemite 380g", I want the app to find that specific product.

**Acceptance Criteria:**
- Searches for the exact product term
- Returns the closest match to the brand+size specified
- If exact product not found, marks as unavailable rather than substituting

### US5: Mobile Support
As a user, I want to use the app on my phone so I can compare prices while shopping.

**Acceptance Criteria:**
- Responsive layout works on mobile screens (320px+)
- Shopping list input is usable on touch devices
- Results are readable without horizontal scrolling on mobile

## Edge Cases

- **Store has no results for an item**: Mark as "unavailable" at that store; exclude from store total
- **API is down or rate-limited**: Show error state for that store; still show results from other stores
- **Ambiguous search results**: For brand-agnostic items, pick the cheapest from the top search results
- **Price is null/missing**: Treat as unavailable
- **Duplicate items in list**: Allow duplicates (user may want 2 different milks)
- **Empty shopping list**: Disable search button; show validation message
- **All stores unavailable**: Show error state explaining no prices could be fetched
- **Coles subscription key unavailable**: Show Coles as temporarily unavailable; proceed with other stores

## In Scope / Out of Scope

### In Scope
- Shopping list structured input with quantities and brand preference
- Real-time price lookup across 4 Australian supermarkets
- Per-store total with item breakdown
- Mix-and-match cheapest list
- Mobile-responsive UI
- Rate limiting / anti-bot mitigation on API calls
- Dynamic Coles subscription key fetching
- Investigation and integration of Aldi and Harris Farm APIs

### Out of Scope
- User accounts / authentication
- Saved shopping lists / persistence
- Price history / tracking over time
- Total savings calculation (difference between single-store and mix-and-match)
- Push notifications / alerts
- Store location / proximity features
- Delivery or pickup integration
- Product images (unless trivially available from API)

## Technical Constraints

- **Frontend**: Next.js with TypeScript, component library as needed
- **Backend**: Node.js / Express with TypeScript
- **No database**: Stateless, real-time lookups only
- **APIs are unofficial**: Discovered via browser DevTools, may change without notice
- **Anti-bot measures**: APIs require spoofed User-Agent headers; need rate limiting strategy
- **Coles subscription key**: Must be dynamically fetched (not hardcoded)

## Store API Details

### Woolworths
- Endpoint: `https://www.woolworths.com.au/apis/ui/Search/products?searchTerm={query}`
- Auth: None (spoof User-Agent)
- Response: `response["Products"]` -> list of groups -> each group `["Products"]` -> items with `DisplayName`, `Price`, `PackageSize`

### Coles
- Endpoint: `https://www.coles.com.au/api/bff/products/search?searchTerm={query}&subscription-key={key}`
- Auth: Azure APIM subscription key (fetch dynamically from browser inspection / page scrape)
- Response: `results` key at top level, products have `name`, `pricing.now`, `pricing.was`, `packageSize`

### Aldi
- Website: `https://www.aldi.com.au/`
- API: Needs investigation
- Notes: Aldi traditionally has limited online product data; may require scraping or may have a hidden API

### Harris Farm
- Website: `https://www.harrisfarm.com.au/`
- API: Needs investigation
- Notes: Likely has a Shopify or similar e-commerce backend with searchable product API
