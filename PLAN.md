# Grocery Price Comparison Web App - Technical Plan

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Store API Integration Strategy](#2-store-api-integration-strategy)
3. [Anti-Bot & Rate Limiting Strategy](#3-anti-bot--rate-limiting-strategy)
4. [Data Model / Types](#4-data-model--types)
5. [Backend Architecture](#5-backend-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [File/Folder Structure](#7-filefolder-structure)
8. [Implementation Tasks](#8-implementation-tasks)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. Architecture Overview

```
+-------------------+          +--------------------+
|   Next.js Frontend|  <--->   |  Express Backend   |
|   (Port 3000)     |  HTTP    |  (Port 4000)       |
|                   |  JSON    |                    |
|  - Shopping list  |          |  - /api/search     |
|  - Results view   |          |  - Store adapters  |
|  - Mobile layout  |          |  - Rate limiter    |
+-------------------+          +----+----+----+----+
                                    |    |    |    |
                        +-----------+    |    |    +-----------+
                        |                |    |                |
                   Woolworths         Coles  Aldi        Harris Farm
                   (Direct API)    (SSR scrape) (API)    (Shopify API)
```

### How They Interact

1. **Frontend (Next.js)**: Renders the shopping list form and results UI. Makes a single POST request to the backend with the shopping list.
2. **Backend (Express)**: Receives the shopping list, fans out search requests to all 4 store adapters in parallel, normalises results into a common format, computes per-store totals and mix-and-match cheapest list, returns everything to the frontend.
3. **No database**: All data is fetched in real-time. No server-side state between requests.

### Why Separate Frontend and Backend?

- The backend handles secret management (Coles build ID, subscription keys) and proxying to avoid CORS issues
- Store APIs require server-side headers (User-Agent spoofing, cookie management) that cannot be done from the browser
- Separation allows backend to be reused (e.g., CLI tool, mobile app) in the future

---

## 2. Store API Integration Strategy

### 2.1 Woolworths

**Status**: Confirmed working.

- **Endpoint**: `GET https://www.woolworths.com.au/apis/ui/Search/products?searchTerm={query}&pageSize=24`
- **Auth**: None. Requires spoofed `User-Agent` header.
- **Response structure**:
  ```
  {
    "Products": [
      {
        "Products": [
          {
            "DisplayName": "Woolworths Full Cream Milk 3L",
            "Price": 4.65,
            "PackageSize": "3L",
            "CupPrice": 1.55,
            "CupMeasure": "1L",
            "Brand": "Woolworths",
            "IsAvailable": true
          }
        ]
      }
    ]
  }
  ```
- **Key fields**: `DisplayName`, `Price`, `PackageSize`, `CupPrice`, `CupMeasure`, `Brand`, `IsAvailable`
- **Per-unit extraction**: `CupPrice` and `CupMeasure` map directly to `unitPrice` / `unitMeasure` (e.g., `CupPrice: 1.55`, `CupMeasure: "1L"`). Normalise to `unitPricePer100g` by converting the measure to 100ml/100g equivalent.
- **Notes**: Products are nested inside groups; need to flatten. Price is in dollars (float).

### 2.2 Coles

**Status**: Confirmed working via Next.js data route.

- **Primary approach**: Fetch search results via the Coles Next.js SSR data endpoint.
  1. Fetch `https://www.coles.com.au/` with cookies to get a session and extract the `buildId` from the `__NEXT_DATA__` script tag.
  2. Use the buildId to hit: `GET https://www.coles.com.au/_next/data/{buildId}/search/products.json?q={query}`
  3. Parse `pageProps.searchResults.results` for product data.
- **Session management**: Need to maintain cookies across requests (Imperva/Incapsula bot protection). First request gets session cookies; subsequent requests use them.
- **Response structure** (from `pageProps.searchResults.results`):
  ```
  {
    "_type": "PRODUCT",
    "id": 8150288,
    "name": "Full Cream Milk",
    "brand": "Coles",
    "description": "COLES FULL CREAM MILK 3L",
    "size": "3L",
    "availability": true,
    "pricing": {
      "now": 4.65,
      "was": 0,
      "unit": {
        "quantity": 1,
        "ofMeasureQuantity": 1,
        "ofMeasureUnits": "l",
        "price": 1.55
      },
      "comparable": "$1.55/ 1L"
    }
  }
  ```
- **Key fields**: `name`, `brand`, `description`, `size`, `availability`, `pricing.now`, `pricing.unit.price`, `pricing.unit.ofMeasureQuantity`, `pricing.unit.ofMeasureUnits`, `pricing.comparable`
- **Per-unit extraction**: `pricing.unit.price` is price per `ofMeasureQuantity` `ofMeasureUnits` (e.g., $1.55 per 1L). Use these to compute `unitPrice`, `unitMeasure`, and `unitPricePer100g`. The `pricing.comparable` string (e.g., `"$1.55/ 1L"`) can be used as a fallback display value.
- **Fallback approach**: If the Next.js data route breaks, can fall back to:
  1. Scrape the subscription key (`BFF_API_SUBSCRIPTION_KEY`) from the homepage HTML
  2. Call the BFF API directly with `Ocp-Apim-Subscription-Key` header
  3. This is blocked by Imperva currently but may work with proper session cookies

### 2.3 Aldi

**Status**: Confirmed working.

- **Endpoint**: `GET https://api.aldi.com.au/v3/product-search?q={query}&serviceType=walk-in`
- **Auth**: None required for basic search. Requires `User-Agent`, `Origin: https://www.aldi.com.au`, and `Referer: https://www.aldi.com.au/` headers.
- **Response structure**:
  ```
  {
    "meta": {
      "pagination": { "offset": 0, "limit": 12, "totalCount": 97 }
    },
    "data": [
      {
        "sku": "000000000000545135",
        "name": "Milk Frother",
        "brandName": "EXPRESSI",
        "sellingSize": null,
        "notForSale": true,
        "price": {
          "amount": 3199,
          "amountRelevantDisplay": "$31.99",
          "currencyCode": "AUD"
        }
      }
    ]
  }
  ```
- **Key fields**: `name`, `brandName`, `sellingSize`, `notForSale`, `price.amount` (integer, cents), `price.amountRelevantDisplay`
- **Per-unit extraction**: The Aldi API does not return a pre-computed unit price. Extract `packageSize` from `sellingSize` (e.g., `"2L"`, `"500g"`), then compute `unitPrice` and `unitPricePer100g` by parsing the size string and dividing `price.amount / 100` accordingly. If `sellingSize` is null or unparseable, set `unitPrice` and `unitPricePer100g` to null.
- **Notes**: Price is in cents (divide by 100). Filter out items where `notForSale === true`. The `sellingSize` field may be null for some items.

### 2.4 Harris Farm

**Status**: Confirmed working.

- **Endpoint**: `GET https://www.harrisfarm.com.au/search/suggest.json?q={query}&resources[type]=product&resources[limit]=10`
- **Auth**: None. Standard Shopify API. Requires `User-Agent` header.
- **Response structure**:
  ```
  {
    "resources": {
      "results": {
        "products": [
          {
            "id": 8561040585,
            "title": "Harris Farm Farmer Friendly Lite Milk 2L",
            "handle": "milk-lite-2l-harris-farm-88662",
            "available": true,
            "price": "3.10",
            "price_max": "3.20",
            "price_min": "3.10",
            "tags": ["Dairy & Eggs", "Fridge", "Kosher", "Milk"],
            "vendor": "HFM"
          }
        ]
      }
    }
  }
  ```
- **Key fields**: `title`, `price` (string, dollars), `price_min`, `price_max`, `available`, `tags`
- **Per-unit extraction**: The Shopify suggest API does not return a pre-computed unit price. Parse `packageSize` from the `title` string using a regex for common size patterns (e.g., `\d+(\.\d+)?\s*(g|kg|ml|L|lb|oz)` — case-insensitive). Compute `unitPrice` and `unitPricePer100g` from the parsed size and price. If size cannot be extracted from the title, set both to null.
- **Notes**: Price is a string (parse to float). The `suggest` endpoint returns limited results (max ~10). For more thorough search, can also use `/products.json?limit=250` with title filtering, but suggest is faster.

### 2.5 Summary Table

| Store | Endpoint Type | Auth | Price Format | Size Field | Display Unit Price Source | Normalised Comparison |
|-------|--------------|------|-------------|------------|--------------------------|----------------------|
| Woolworths | Direct REST API | User-Agent | Float (dollars) | `PackageSize` | `CupPrice` / `CupMeasure` verbatim; re-expressed in contextual units | Derived from `CupPrice` + `CupMeasure` |
| Coles | Next.js SSR data | Cookies + buildId | Float (dollars) | `size` | `pricing.unit.price` / `ofMeasureUnits` verbatim; re-expressed in contextual units | Derived from `pricing.unit` fields |
| Aldi | Direct REST API | User-Agent + Origin/Referer | Integer (cents) | `sellingSize` | Computed via `unit-price.ts` using contextual unit selection | Computed via `unit-price.ts` to per-100g/100ml |
| Harris Farm | Shopify suggest API | User-Agent | String (dollars) | Parsed from `title` | Computed via `unit-price.ts` using contextual unit selection | Computed via `unit-price.ts` to per-100g/100ml |

---

## 3. Anti-Bot & Rate Limiting Strategy

### 3.1 Request Headers

All store adapters will use a realistic Chrome User-Agent header:
```
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36
```

Additional headers per store:
- **Aldi**: `Origin: https://www.aldi.com.au`, `Referer: https://www.aldi.com.au/`
- **Coles**: Session cookies (managed via cookie jar)
- **Woolworths**: None additional
- **Harris Farm**: None additional

### 3.2 Rate Limiting

- **Per-store request throttling**: Use a token bucket or simple delay between requests to the same store
- **Backend-level rate limiter**: Limit total concurrent outbound requests (e.g., max 2 concurrent per store)
- **Coles session caching**: Cache the Coles session (cookies + buildId) for a configurable TTL (e.g., 5 minutes) to avoid fetching a new session on every search
- **Request deduplication**: If two users search for "milk" within a short window, reuse the cached result rather than hitting the store API again
  - In-memory cache with short TTL (30-60 seconds)
  - Key: `${store}:${normalizedQuery}`

### 3.3 Error Handling

- If a store API returns an error or times out (10 second timeout per store), mark that store's results as `unavailable` rather than failing the entire request
- Retry once with exponential backoff on transient errors (5xx, network errors)
- For Coles: if the buildId is stale (404 on data route), re-fetch from homepage and retry once

---

## 4. Data Model / Types

All shared types will live in a `shared/types` package used by both frontend and backend.

### 4.1 Shopping List Types

```typescript
interface ShoppingListItem {
  id: string;                    // Client-generated UUID
  name: string;                  // e.g., "milk 2L" or "Vegemite 380g"
  quantity: number;              // e.g., 3
  isBrandSpecific: boolean;      // User indicates if brand matters
}

interface ShoppingList {
  items: ShoppingListItem[];
}
```

### 4.2 Search Result Types

```typescript
type StoreName = "woolworths" | "coles" | "aldi" | "harrisfarm";

interface ProductMatch {
  store: StoreName;
  productName: string;           // e.g., "Coles Full Cream Milk 3L"
  brand: string;                 // e.g., "Coles"
  price: number;                 // In dollars (float), e.g., 4.65
  packageSize: string;           // e.g., "3L"

  // --- Display unit price (what the user sees) ---
  // Expressed in contextually appropriate units chosen by the adapter or utility:
  //   - Small weight items (< 1kg): per 100g  e.g., "$0.89 / 100g"
  //   - Large weight items (>= 1kg): per kg   e.g., "$5.50 / kg"
  //   - Small volume items (< 1L): per 100ml  e.g., "$0.15 / 100ml"
  //   - Large volume items (>= 1L): per litre e.g., "$1.55 / L"
  //   - Count-based items (each, pack): per unit e.g., "$0.25 / each"
  // For Woolworths + Coles: use the store's pre-computed value verbatim where available
  // For Aldi + Harris Farm: compute from packageSize using contextually appropriate unit
  unitPrice: number | null;      // e.g., 0.89
  unitMeasure: string | null;    // e.g., "100g", "kg", "100ml", "L", "each"

  // --- Normalised comparison price (internal use only, not displayed) ---
  // Always expressed as: price per 100g for weight items, price per 100ml for volume items
  // Used solely for sorting / finding the cheapest option across different pack sizes
  // e.g., a 500g bag at $4.45 and a 1kg bag at $7.50 both normalise to per-100g for comparison
  // null if unit cannot be resolved to a weight or volume measure (e.g., "each", "pack of 4")
  unitPriceNormalised: number | null;

  available: boolean;
}

interface ItemSearchResult {
  shoppingListItemId: string;    // References ShoppingListItem.id
  shoppingListItemName: string;  // Original search term
  quantity: number;              // From the shopping list
  matches: ProductMatch[];       // One per store (best match from each)
}
```

### 4.3 Comparison Output Types

```typescript
interface StoreTotal {
  store: StoreName;
  storeName: string;             // Display name, e.g., "Woolworths"
  items: StoreItemResult[];
  total: number;                 // Sum of available item prices * quantities
  unavailableCount: number;      // Number of items not available
  allItemsAvailable: boolean;
}

interface StoreItemResult {
  shoppingListItemId: string;
  shoppingListItemName: string;
  quantity: number;
  match: ProductMatch | null;    // null if unavailable at this store
  lineTotal: number;             // price * quantity (0 if unavailable)
}

interface MixAndMatchResult {
  items: MixAndMatchItem[];
  total: number;                 // Sum of cheapest prices * quantities
}

interface MixAndMatchItem {
  shoppingListItemId: string;
  shoppingListItemName: string;
  quantity: number;
  cheapestMatch: ProductMatch | null;  // Cheapest across all stores
  lineTotal: number;
}

interface ComparisonResponse {
  storeTotals: StoreTotal[];           // One per store, sorted by total ascending
  mixAndMatch: MixAndMatchResult;      // Cheapest per-item across stores
  searchResults: ItemSearchResult[];   // Raw results for all items
}
```

---

## 5. Backend Architecture

### 5.1 Express Server Structure

```
POST /api/search
  Request body: { items: ShoppingListItem[] }
  Response: ComparisonResponse
```

### 5.2 Store Adapter Interface

Each store adapter implements a common interface:

```typescript
interface StoreAdapter {
  readonly storeName: StoreName;
  readonly displayName: string;
  searchProduct(query: string): Promise<ProductMatch[]>;
  isAvailable(): Promise<boolean>;  // Health check
}
```

### 5.3 Search Orchestrator

The search orchestrator:
1. Receives the shopping list
2. For each item, calls all 4 store adapters in parallel
3. For each store, selects the best match (cheapest for brand-agnostic, closest for brand-specific)
4. Assembles the `ComparisonResponse`

```typescript
class SearchOrchestrator {
  async search(items: ShoppingListItem[]): Promise<ComparisonResponse> {
    // 1. Fan out: search all items across all stores in parallel
    const results = await Promise.allSettled(
      items.map(item => this.searchItem(item))
    );

    // 2. Build per-store totals
    const storeTotals = this.buildStoreTotals(results);

    // 3. Build mix-and-match
    const mixAndMatch = this.buildMixAndMatch(results);

    return { storeTotals, mixAndMatch, searchResults: results };
  }
}
```

### 5.4 Matching Strategy

For **brand-agnostic** items (e.g., "milk 2L"):
1. Search the store API with the query
2. Filter results to those that are available
3. Sort by price ascending
4. Return the cheapest match

For **brand-specific** items (e.g., "Vegemite 380g"):
1. Search the store API with the query
2. Filter results to those that are available
3. Return the first/best match (APIs return relevance-sorted results)
4. If no close match found, mark as unavailable

### 5.5 Coles Session Manager

A dedicated module manages the Coles session lifecycle:

```typescript
class ColesSessionManager {
  private cookies: string | null = null;
  private buildId: string | null = null;
  private lastRefreshed: number = 0;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async ensureSession(): Promise<{ cookies: string; buildId: string }> {
    if (this.isExpired()) {
      await this.refresh();
    }
    return { cookies: this.cookies!, buildId: this.buildId! };
  }

  private async refresh(): Promise<void> {
    // 1. Fetch Coles homepage with cookie jar
    // 2. Extract buildId from __NEXT_DATA__
    // 3. Store cookies and buildId
  }
}
```

---

## 6. Frontend Architecture

### 6.1 Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Shopping list form + results display |

Single-page app with the shopping list form at the top and results below.

### 6.2 Component Tree

```
<HomePage>
  <Header />
  <ShoppingListForm>
    <ShoppingListItem />      (repeated for each item)
    <AddItemButton />
  </ShoppingListForm>
  <SearchButton />
  <LoadingSpinner />           (shown during search)
  <ErrorBanner />              (shown if all stores fail)
  <ComparisonResults>
    <ResultsLayout>            (responsive: tabs on mobile, columns on desktop)
      <StoreColumn             (one per store + mix-and-match)
        store={storeTotal}>
        <StoreHeader />
        <ItemRow />            (repeated for each item)
        <StoreFooter />        (total)
      </StoreColumn>
    </ResultsLayout>
  </ComparisonResults>
</HomePage>
```

### 6.3 Component Details

**ShoppingListForm**:
- Dynamic list of items
- Each item has: text input (name), number input (quantity, default 1), toggle/checkbox (brand-specific)
- Add/remove item buttons
- Minimum 1 item to search

**ComparisonResults**:
- Desktop: Side-by-side columns (stores + mix-and-match)
- Mobile: Horizontal scrollable tabs or accordion
- Each column shows item-by-item prices with "unavailable" markers
- Each item row shows:
  - Product name and package size
  - Total price for the line (price × quantity)
  - Per-unit cost as a secondary label (e.g., "$1.55 / 100ml" or "$0.89 / 100g") where available — allows value comparison across different pack sizes
- Store with lowest total is highlighted
- Mix-and-match column shows which store each item comes from

### 6.4 Component Library

Use **shadcn/ui** for base components:
- Input, Button, Card, Badge, Tabs, Table, Skeleton (loading), Alert
- Styled with Tailwind CSS (comes with shadcn/ui)
- Provides accessible, mobile-friendly components out of the box

### 6.5 State Management

- Use React `useState` and `useReducer` for shopping list state (simple, no external state library needed)
- Use `fetch` for API calls (no need for React Query given the simple single-request pattern)
- Loading state, error state, and results state managed locally in the page component

---

## 7. File/Folder Structure

```
grocerycomparison/
├── PLAN.md
├── package.json                     (workspace root)
├── tsconfig.base.json               (shared TS config)
├── .gitignore
│
├── packages/
│   └── shared/                      (shared types package)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── types/
│               ├── index.ts
│               ├── shopping-list.ts
│               ├── product.ts
│               └── comparison.ts
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                 (Express app entry point)
│   │   ├── routes/
│   │   │   └── search.ts            (POST /api/search)
│   │   ├── services/
│   │   │   ├── search-orchestrator.ts
│   │   │   ├── result-builder.ts    (builds ComparisonResponse)
│   │   │   └── cache.ts             (in-memory result cache)
│   │   ├── adapters/
│   │   │   ├── store-adapter.ts     (interface)
│   │   │   ├── woolworths.ts
│   │   │   ├── coles.ts
│   │   │   ├── aldi.ts
│   │   │   └── harris-farm.ts
│   │   ├── utils/
│   │   │   ├── http-client.ts       (shared HTTP client with headers)
│   │   │   ├── rate-limiter.ts
│   │   │   ├── unit-price.ts        (normalises unit price to per-100g/100ml)
│   │   │   └── coles-session.ts     (Coles session manager)
│   │   └── config.ts                (configuration constants)
│   └── tests/
│       ├── adapters/
│       │   ├── woolworths.test.ts
│       │   ├── coles.test.ts
│       │   ├── aldi.test.ts
│       │   └── harris-farm.test.ts
│       ├── services/
│       │   ├── search-orchestrator.test.ts
│       │   └── result-builder.test.ts
│       └── routes/
│           └── search.test.ts
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             (home page)
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                  (shadcn/ui components)
│   │   │   ├── shopping-list/
│   │   │   │   ├── ShoppingListForm.tsx
│   │   │   │   ├── ShoppingListItem.tsx
│   │   │   │   └── AddItemButton.tsx
│   │   │   ├── results/
│   │   │   │   ├── ComparisonResults.tsx
│   │   │   │   ├── ResultsLayout.tsx
│   │   │   │   ├── StoreColumn.tsx
│   │   │   │   ├── ItemRow.tsx
│   │   │   │   └── StoreHeader.tsx
│   │   │   └── common/
│   │   │       ├── Header.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── ErrorBanner.tsx
│   │   ├── lib/
│   │   │   ├── api.ts               (API client)
│   │   │   └── utils.ts             (formatPrice, etc.)
│   │   └── hooks/
│   │       └── useShoppingList.ts   (shopping list state)
│   └── tests/
│       ├── components/
│       │   ├── ShoppingListForm.test.tsx
│       │   └── ComparisonResults.test.tsx
│       └── hooks/
│           └── useShoppingList.test.ts
│
└── docs/
    ├── requirements/
    ├── plans/
    ├── decisions/
    └── state/
```

---

## 8. Implementation Tasks

Tasks are ordered by dependency. Each task follows TDD: write tests first, then implement.

### Phase 1: Project Setup

**[T001] Setup: Project scaffolding and configuration**
- Type: Setup
- Initialize monorepo with npm workspaces
- Create `packages/shared`, `backend/`, `frontend/` directories
- Configure TypeScript (base config + per-package configs)
- Install core dependencies: express, next, react, typescript
- Install dev dependencies: vitest, @testing-library/react, supertest
- Configure Tailwind CSS and shadcn/ui in frontend
- Create .gitignore
- Dependencies: None

### Phase 2: Shared Types

**[T002] Test: Shared type definitions**
- Type: Test
- Write type validation tests (ensure types compile, test type guards)
- Dependencies: T001

**[T003] Implement: Shared type definitions**
- Type: Implement
- Create all types defined in Section 4 (shopping list, product, comparison)
- Create type guard functions for runtime validation
- Dependencies: T002

### Phase 3: Backend - Store Adapters

**[T004] Test: HTTP client, rate limiter, and unit price utilities**
- Type: Test
- Test HTTP client makes requests with correct headers
- Test rate limiter throttles concurrent requests
- Test unit price utility (two concerns tested separately):
  - **Display unit** — contextually appropriate unit chosen based on size:
    - 500g item → displays per 100g (e.g., `$0.89 / 100g`)
    - 2kg item → displays per kg (e.g., `$5.50 / kg`)
    - 600ml item → displays per 100ml (e.g., `$0.25 / 100ml`)
    - 2L item → displays per L (e.g., `$1.55 / L`)
    - Count-based item → displays per each
  - **Normalised comparison value** — always per-100g or per-100ml regardless of pack size:
    - 500g at $4.45 → $0.89 / 100g
    - 2kg at $11.00 → $0.55 / 100g (same base, enables correct size comparison)
    - Returns null for count-based units
  - Handles weight units: g, kg, mg, oz, lb
  - Handles volume units: ml, L, fl oz
  - Parses size strings from product titles (e.g., "500g", "1.5L", "2 x 250ml")
- Dependencies: T003

**[T005] Implement: HTTP client, rate limiter, and unit price utilities**
- Type: Implement
- Create shared HTTP client (axios or fetch wrapper) with default headers
- Create per-store rate limiter
- Create `unit-price.ts` utility with two distinct concerns:
  1. **Display unit** (contextually appropriate for the human reader):
     - `parsePackageSize(sizeString: string): { quantity: number; unit: string } | null`
     - `computeDisplayUnitPrice(price: number, quantity: number, unit: string): { unitPrice: number; unitMeasure: string } | null`
     - Logic: weight < 1000g → per 100g; weight ≥ 1000g → per kg; volume < 1000ml → per 100ml; volume ≥ 1000ml → per L; count-based → per each
  2. **Normalised comparison value** (fixed base unit for sorting/cheapest logic):
     - `computeNormalisedUnitPrice(price: number, quantity: number, unit: string): number | null`
     - Always returns per-100g for weight, per-100ml for volume, null for count-based
     - Weight and volume are kept separate (no cross-conversion)
- Dependencies: T004

**[T006] [P] Test: Woolworths adapter**
- Type: Test
- Test parsing Woolworths API response to ProductMatch[]
- Test handling of missing prices, unavailable items
- Test error handling (API down, timeout)
- Mock HTTP responses
- Dependencies: T005

**[T007] [P] Test: Coles adapter**
- Type: Test
- Test Coles session manager (buildId extraction, cookie caching)
- Test parsing Coles SSR response to ProductMatch[]
- Test session refresh on stale buildId
- Test error handling
- Mock HTTP responses
- Dependencies: T005

**[T008] [P] Test: Aldi adapter**
- Type: Test
- Test parsing Aldi API response to ProductMatch[]
- Test price conversion from cents to dollars
- Test filtering out notForSale items
- Test error handling
- Mock HTTP responses
- Dependencies: T005

**[T009] [P] Test: Harris Farm adapter**
- Type: Test
- Test parsing Shopify suggest response to ProductMatch[]
- Test price string to float conversion
- Test error handling
- Mock HTTP responses
- Dependencies: T005

**[T010] [P] Implement: Woolworths adapter**
- Type: Implement
- Implement Woolworths store adapter
- Dependencies: T006

**[T011] [P] Implement: Coles adapter**
- Type: Implement
- Implement Coles session manager
- Implement Coles store adapter using Next.js data route
- Dependencies: T007

**[T012] [P] Implement: Aldi adapter**
- Type: Implement
- Implement Aldi store adapter
- Dependencies: T008

**[T013] [P] Implement: Harris Farm adapter**
- Type: Implement
- Implement Harris Farm store adapter
- Dependencies: T009

### Phase 4: Backend - Search Logic

**[T014] Test: Search orchestrator**
- Type: Test
- Test parallel search across all stores
- Test graceful handling when one store fails
- Test result assembly
- Dependencies: T010, T011, T012, T013

**[T015] Implement: Search orchestrator**
- Type: Implement
- Implement search orchestrator with parallel fan-out
- Dependencies: T014

**[T016] Test: Result builder (comparison logic)**
- Type: Test
- Test per-store total calculation
- Test mix-and-match cheapest selection
- Test handling of unavailable items
- Test sorting (cheapest store first)
- Dependencies: T003

**[T017] Implement: Result builder**
- Type: Implement
- Implement comparison response builder
- Dependencies: T016

**[T018] Test: Search API route**
- Type: Test
- Test POST /api/search endpoint (integration test with mocked adapters)
- Test request validation
- Test error responses
- Dependencies: T015, T017

**[T019] Implement: Search API route and Express server**
- Type: Implement
- Wire up Express server with search route
- Add input validation, error handling middleware, CORS
- Dependencies: T018

### Phase 5: Frontend

**[T020] Test: Shopping list hook and form**
- Type: Test
- Test useShoppingList hook (add, remove, update items)
- Test ShoppingListForm rendering and interactions
- Dependencies: T001

**[T021] Implement: Shopping list form components**
- Type: Implement
- Implement useShoppingList hook
- Implement ShoppingListForm, ShoppingListItem, AddItemButton
- Style with Tailwind/shadcn
- Dependencies: T020

**[T022] Test: Comparison results components**
- Type: Test
- Test ComparisonResults rendering with mock data
- Test StoreColumn, ItemRow display
- Test unavailable item handling
- Test mobile vs desktop layout
- Dependencies: T003

**[T023] Implement: Comparison results components**
- Type: Implement
- Implement ComparisonResults, ResultsLayout, StoreColumn, ItemRow, StoreHeader
- Implement responsive layout (columns on desktop, tabs/scroll on mobile)
- Dependencies: T022

**[T024] Test: API client and page integration**
- Type: Test
- Test API client function
- Test page component integration (form submission triggers search, results displayed)
- Dependencies: T021, T023

**[T025] Implement: Page integration**
- Type: Implement
- Implement API client
- Wire up the home page: form -> API call -> results display
- Add loading states, error states
- Implement Header component
- Dependencies: T024

### Phase 6: Polish

**[T026] Implement: Error handling and edge cases**
- Type: Implement
- Add graceful degradation when stores are unavailable
- Add loading skeletons
- Handle empty results
- Dependencies: T025

---

## 9. Testing Strategy

### 9.1 Testing Framework

- **Backend**: Vitest (fast, TypeScript-native, ESM support)
- **Frontend**: Vitest + React Testing Library
- **HTTP mocking**: msw (Mock Service Worker) for intercepting HTTP requests in tests
- **Integration tests**: Supertest for Express route testing

### 9.2 TDD Approach

Every task follows strict TDD:
1. **Write failing tests first** that describe the expected behavior
2. **Implement** just enough code to make tests pass
3. **Review** for TDD compliance (no untested code paths)
4. **Simplify** (refactor while keeping tests green)

### 9.3 Test Categories

| Category | What | Tools | Where |
|----------|------|-------|-------|
| Unit | Store adapter parsing | Vitest + msw | `backend/tests/adapters/` |
| Unit | Result builder logic | Vitest | `backend/tests/services/` |
| Unit | React components | Vitest + RTL | `frontend/tests/components/` |
| Unit | React hooks | Vitest + RTL | `frontend/tests/hooks/` |
| Integration | API routes | Vitest + Supertest | `backend/tests/routes/` |
| Integration | Page flow | Vitest + RTL + msw | `frontend/tests/` |

### 9.4 Mock Data

Create fixture files with real API responses from each store:
- `backend/tests/fixtures/woolworths-milk.json`
- `backend/tests/fixtures/coles-milk.json`
- `backend/tests/fixtures/aldi-milk.json`
- `backend/tests/fixtures/harrisfarm-milk.json`

These are captured from the actual API calls made during investigation and will be used to verify parsing logic works correctly.

### 9.5 What NOT to Test

- Actual HTTP calls to store APIs (always mocked)
- CSS styling / visual regression
- Next.js framework internals (routing, SSR)

---

## Appendix A: API Response Fixtures

The following real responses were captured during API investigation (February 2026) and should be saved as test fixtures.

### Woolworths - "milk" search (first product)
```json
{
  "DisplayName": "Woolworths Full Cream Milk 3L",
  "Price": 4.65,
  "PackageSize": "3L",
  "CupPrice": 1.55,
  "CupMeasure": "1L",
  "Brand": "Woolworths",
  "IsAvailable": true
}
```

### Coles - "milk" search (first product)
```json
{
  "_type": "PRODUCT",
  "id": 8150288,
  "name": "Full Cream Milk",
  "brand": "Coles",
  "description": "COLES FULL CREAM MILK 3L",
  "size": "3L",
  "availability": true,
  "pricing": {
    "now": 4.65,
    "was": 0,
    "unit": {
      "quantity": 1,
      "ofMeasureQuantity": 1,
      "ofMeasureUnits": "l",
      "price": 1.55
    },
    "comparable": "$1.55/ 1L"
  }
}
```

### Aldi - "milk" search (sample product)
```json
{
  "sku": "000000000000545135",
  "name": "Milk Frother",
  "brandName": "EXPRESSI",
  "sellingSize": null,
  "notForSale": true,
  "price": {
    "amount": 3199,
    "amountRelevantDisplay": "$31.99",
    "currencyCode": "AUD"
  }
}
```

### Harris Farm - "milk" search (first product)
```json
{
  "id": 8561040585,
  "title": "Harris Farm Farmer Friendly Lite Milk 2L",
  "handle": "milk-lite-2l-harris-farm-88662",
  "available": true,
  "price": "3.10",
  "price_max": "3.20",
  "price_min": "3.10",
  "tags": ["Dairy & Eggs", "Fridge", "Kosher", "Milk"],
  "vendor": "HFM"
}
```

## Appendix B: Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Next.js + TypeScript | User requirement |
| Backend framework | Express + TypeScript | User requirement |
| Component library | shadcn/ui + Tailwind | Good DX, accessible, mobile-friendly, works with Next.js |
| Test framework | Vitest | Fast, TypeScript-native, ESM support, compatible with RTL |
| HTTP mocking | msw | Intercepts at network level, works in both Node and browser |
| Monorepo structure | npm workspaces | Simple, built-in, no additional tooling |
| Coles API approach | Next.js data route | Most reliable; avoids Imperva WAF blocking |
| Aldi API approach | Direct REST API | Publicly accessible, JSON responses, no auth needed |
| Harris Farm API | Shopify suggest endpoint | Fast, returns product data with prices |
| State management | React useState/useReducer | Simple app, no need for Redux/Zustand |
