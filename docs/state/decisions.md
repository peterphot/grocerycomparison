# Decision Log: grocery-price-comparison
_Initialized: 2026-02-27T05:00:00Z_

## Clarify Phase
_Captured: 2026-02-27T05:05:00Z_

### D-CLARIFY-001: Next.js frontend with component library
- **Who decided**: user
- **What**: Use Next.js with TypeScript for the frontend, with component libraries as needed
- **Why**: User preference; Next.js provides SSR, routing, and good DX out of the box
- **Alternatives**: React (CRA), Vue, Svelte, plain HTML/JS
- **Context**: Asked user which frontend framework to use

### D-CLARIFY-002: Node.js/Express backend with TypeScript
- **Who decided**: user
- **What**: Use Express on Node.js with TypeScript for the backend API
- **Why**: User preference; familiar stack, good ecosystem for HTTP proxying
- **Alternatives**: Python/FastAPI, Python/Flask, Go
- **Context**: Asked user which backend framework to use

### D-CLARIFY-003: Stateless architecture, no database
- **Who decided**: user
- **What**: No user accounts, no persistence, no database. Real-time price lookups only.
- **Why**: Simplicity for v1; can add persistence later
- **Alternatives**: SQLite for price caching, Redis for session state
- **Context**: Asked about persistence and user accounts

### D-CLARIFY-004: Structured form input with quantities
- **Who decided**: user
- **What**: Shopping list uses structured form fields (not free-text), supports quantities like "3x milk 2L"
- **Why**: Better UX and easier parsing than free-text
- **Alternatives**: Free-text textarea (one item per line), CSV import
- **Context**: Asked about shopping list input format

### D-CLARIFY-005: Closest size match for brand-agnostic items
- **Who decided**: user
- **What**: For brand-agnostic items, match the closest available size to what was requested
- **Why**: Users want approximate matches when exact size unavailable
- **Alternatives**: Exact match only, show all sizes and let user pick
- **Context**: Asked how to handle size mismatches in brand-agnostic search

### D-CLARIFY-006: Dynamically fetch Coles subscription key
- **Who decided**: user
- **What**: Fetch the Coles Azure APIM subscription key dynamically rather than hardcoding
- **Why**: Key may rotate; hardcoding is fragile
- **Alternatives**: Hardcode key, user provides key manually
- **Context**: Asked how to handle the Coles API authentication

### D-CLARIFY-007: Include all 4 stores from the start
- **Who decided**: user
- **What**: Include Woolworths, Coles, Aldi, and Harris Farm in the initial build
- **Why**: User wants comprehensive coverage from day one
- **Alternatives**: Start with Woolworths and Coles only, add others later
- **Context**: Asked whether to start with known APIs or include all 4

### D-CLARIFY-008: Per-store breakdown with unavailable markers
- **Who decided**: user
- **What**: Show each store's item-by-item prices, mark unavailable items, show per-store total and mix-and-match side by side
- **Why**: Users need detailed comparison to make informed decisions
- **Alternatives**: Show totals only, show only cheapest option
- **Context**: Asked about results display format

### D-CLARIFY-009: Mobile-responsive UI required
- **Who decided**: user
- **What**: The app must work well on mobile devices
- **Why**: Users may compare prices while physically shopping
- **Alternatives**: Desktop-only
- **Context**: Asked about mobile support

## Orchestrate Phase
_Captured: 2026-02-27T05:05:00Z_

### D-ORCH-001: MEDIUM scale assessment
- **Who decided**: claude
- **What**: Assessed project as MEDIUM scale (estimated 8-12 implementation tasks)
- **Why**: The project has 4 store API integrations (each non-trivial), a structured frontend with comparison views, and a backend proxy layer. It is beyond a simple 1-3 task project but not large enough to warrant council pattern or feature splitting.
- **Alternatives**: SMALL (would underestimate API integration complexity), LARGE (would overestimate scope given no persistence/auth)
- **Context**: Scale assessment for orchestration pattern selection

### D-ORCH-002: STANDARD orchestration pattern
- **Who decided**: claude
- **What**: Use STANDARD sequential orchestration pattern
- **Why**: Tasks have natural dependencies (backend before frontend, shared types before both). Parallel execution opportunities are limited since store adapters share common types/interfaces.
- **Alternatives**: PARALLEL (some store adapters could be parallelized but share interface), COUNCIL (not needed for medium scope)
- **Context**: Selecting orchestration pattern based on project scale and task dependencies

## Plan Phase
_Captured: 2026-02-27T05:30:00Z_

### D-PLAN-001: Coles API via Next.js SSR data route
- **Who decided**: claude
- **What**: Access Coles product data via the Next.js `_next/data/{buildId}/search/products.json` endpoint rather than direct BFF API calls
- **Why**: The direct BFF API (`prod2apigw.cmltd.net.au`) doesn't resolve externally and the public gateway (`apigw.coles.com.au`) is blocked by Imperva WAF. The Next.js data route returns clean JSON and works with basic cookie management.
- **Alternatives**: Direct BFF API (DNS fails), public gateway (WAF blocks), full page scrape (slower, fragile)
- **Context**: API investigation revealed the direct endpoints are inaccessible from external clients

### D-PLAN-002: Aldi API via public Glue API v3
- **Who decided**: claude
- **What**: Use `https://api.aldi.com.au/v3/product-search?q={query}&serviceType=walk-in` for Aldi product search
- **Why**: Discovered this API from Aldi's Nuxt.js frontend bundle. It returns JSON with product data, prices, and availability. No authentication required beyond Origin/Referer headers.
- **Alternatives**: CMS content API (product-recalls only, no search), page scraping (fragile)
- **Context**: Aldi was listed as "needs investigation" - investigated their Spryker-based e-commerce frontend

### D-PLAN-003: Harris Farm via Shopify suggest endpoint
- **Who decided**: claude
- **What**: Use `https://www.harrisfarm.com.au/search/suggest.json?q={query}&resources[type]=product` for Harris Farm search
- **Why**: Harris Farm runs on Shopify. The suggest endpoint returns product data with prices, availability, and titles. Fast and reliable.
- **Alternatives**: `/products.json` (returns all products, requires client-side filtering, slower), page scraping
- **Context**: Investigated Harris Farm's Shopify-based website

### D-PLAN-004: shadcn/ui + Tailwind for component library
- **Who decided**: claude
- **What**: Use shadcn/ui with Tailwind CSS for the frontend component library
- **Why**: Provides accessible, customisable, mobile-friendly components. Works natively with Next.js. No heavy runtime dependency (components are copied into project).
- **Alternatives**: Material UI (heavier), Radix UI (lower level), Ant Design (opinionated styling), no library (more work)
- **Context**: User said "component library where necessary"

### D-PLAN-005: Vitest as test framework
- **Who decided**: claude
- **What**: Use Vitest for both backend and frontend testing
- **Why**: Fast, TypeScript-native, ESM support, compatible with React Testing Library, works well in monorepo setups
- **Alternatives**: Jest (slower ESM support, needs transforms), Mocha (less integrated), Bun test (less mature)
- **Context**: Needed a test framework that works for TDD across the full stack

### D-PLAN-006: npm workspaces for monorepo
- **Who decided**: claude
- **What**: Use npm workspaces to manage the monorepo with shared/, backend/, and frontend/ packages
- **Why**: Built into npm, no additional tooling needed, simple setup for shared types
- **Alternatives**: pnpm workspaces (faster but adds dependency), turborepo (overkill), separate repos (harder to share types)
- **Context**: Need to share TypeScript types between frontend and backend

### D-PLAN-007: msw for HTTP mocking in tests
- **Who decided**: claude
- **What**: Use Mock Service Worker (msw) for mocking HTTP responses in adapter tests
- **Why**: Intercepts at the network level, works the same way regardless of HTTP client used, realistic testing
- **Alternatives**: nock (Node-only), manual mocks (less realistic), custom fetch mock (more work)
- **Context**: Store adapters make HTTP calls that need to be mocked in tests

### D-PLAN-008: Parallel store adapter tasks
- **Who decided**: claude
- **What**: Mark store adapter tasks (T006-T013) as parallelizable [P] since they are independent of each other
- **Why**: All 4 store adapters share the same interface but have no dependencies between them. Writing and implementing them in parallel speeds up the build phase.
- **Alternatives**: Sequential implementation (slower, no benefit)
- **Context**: Optimizing task execution order in the plan

---

## Clarify Phase (backend-cors-testability)
_Captured: 2026-02-28T04:00:00Z_

### D-CLARIFY-010: Single-origin CORS configuration
- **Who decided**: user
- **What**: Use a single `FRONTEND_ORIGIN` value for CORS (not comma-separated multi-origin)
- **Why**: Keep it simple for v1
- **Alternatives**: Comma-separated list of origins, wildcard
- **Context**: Asked whether CORS should support multiple origins

### D-CLARIFY-011: Default cors() options only
- **Who decided**: user
- **What**: Use `cors({ origin: FRONTEND_ORIGIN })` with no additional options (no credentials, no custom headers)
- **Why**: No current need for credentials or custom headers
- **Alternatives**: `credentials: true`, specific allowed methods/headers
- **Context**: Asked about CORS configuration options

### D-CLARIFY-012: Keep sample test, add new test file
- **Who decided**: user
- **What**: Keep `sample.test.ts` unchanged; add supertest tests in a new `app.test.ts` file
- **Why**: Existing test provides baseline sanity check; new tests belong in their own file
- **Alternatives**: Replace sample test, merge into one file
- **Context**: Asked whether to keep or replace the sample test

## Orchestrate Phase (backend-cors-testability)
_Captured: 2026-02-28T04:00:00Z_

### D-ORCH-003: SMALL scale assessment for backend-cors-testability
- **Who decided**: claude
- **What**: Assessed this fix as SMALL scale (2 tightly-scoped tasks)
- **Why**: Both issues are well-defined with clear scope: wire up CORS middleware and split app/server. No new features, no architecture changes, minimal files affected.
- **Alternatives**: MEDIUM (would overestimate; this is a targeted fix)
- **Context**: Scale assessment for the backend CORS and testability fix

### D-ORCH-004: STANDARD sequential pattern for backend-cors-testability
- **Who decided**: claude
- **What**: Use STANDARD sequential orchestration (no parallelism needed)
- **Why**: Only 2 tasks and they are tightly coupled (the app/server split must happen before or alongside CORS wiring). No benefit to parallel execution.
- **Alternatives**: PARALLEL (unnecessary for 2 dependent tasks)
- **Context**: Selecting orchestration pattern for a small fix

## Constraint Decisions
_Captured: 2026-02-28_

### D-CONSTRAINT-001: Metric units only — no imperial
- **Who decided**: user
- **What**: All unit handling must use metric system only (g, kg, ml, L). No support for imperial units (oz, lb, fl oz).
- **Why**: This is an Australian product for Australian users. Australia uses the metric system exclusively. Imperial units add unnecessary complexity and are not used by Australian supermarkets.
- **Alternatives**: Support both metric and imperial (rejected — unnecessary for AU market)
- **Context**: User directive during PR #5 review. Affects unit-price.ts, all store adapters, and any size-string parsing.

---

## Clarify Phase (T018 UI Audit)
_Captured: 2026-03-01T10:00:00Z_

### D-CLARIFY-013: Focus on resilience, not fixing external APIs
- **Who decided**: user
- **What**: For B1/B2 (Coles/Aldi returning zero results), focus on error propagation (B3) and clear UI error states rather than fixing external API calls
- **Why**: External APIs change frequently; resilience is more reliable than chasing moving targets
- **Alternatives**: Fix Coles buildId regex and Aldi API headers directly
- **Context**: Asked whether to fix actual API calls or focus on making the system resilient to adapter failures

### D-CLARIFY-014: Mix & Match uses absolute price (same as store columns)
- **Who decided**: user
- **What**: Align Mix & Match algorithm to use absolute price per item, same as individual store columns
- **Why**: Users expect lowest total spend, not best unit price
- **Alternatives**: Keep unit price comparison, or communicate that Mix & Match optimizes by unit price
- **Context**: B4 - Mix & Match was using unitPriceNormalised while store columns used absolute price

### D-CLARIFY-015: Remove Help link entirely
- **Who decided**: user
- **What**: Remove the non-functional Help link from the header
- **Why**: Simpler and cleaner than implementing a help modal
- **Alternatives**: Implement a help section/modal
- **Context**: UX1 - Help link navigated to #help anchor with no content

### D-CLARIFY-016: Fixed store column order matching design
- **Who decided**: user
- **What**: Always show stores in fixed order: Woolworths, Coles, Aldi, Harris Farm, Mix & Match
- **Why**: Matches the Pencil design file
- **Alternatives**: Sort by price ascending, sort cheapest-with-results first
- **Context**: F6 - Store column/tab order differed from design

### D-CLARIFY-017: Show quantity badges on all items
- **Who decided**: user
- **What**: Show quantity badges on every item (not just when qty > 1)
- **Why**: Matches the Pencil design
- **Alternatives**: Only show when qty > 1, or show when any item has qty > 1
- **Context**: F2 - Design shows qty badges on all items

### D-CLARIFY-018: Save link scrolls to Mix & Match column/tab
- **Who decided**: user
- **What**: "Save $X with Mix & Match" link scrolls to Mix & Match column on desktop, switches to Mix & Match tab on mobile
- **Why**: Natural navigation to the savings source
- **Alternatives**: No navigation action, open a modal
- **Context**: F4 - Missing "Save $X with Mix & Match" link/CTA

### D-CLARIFY-019: Mobile default tab is cheapest store
- **Who decided**: user
- **What**: Auto-select the tab for the store marked as "cheapest store" on mobile
- **Why**: Shows the most relevant store first
- **Alternatives**: Default to first tab (Woolworths), default to Mix & Match
- **Context**: F7 - Mobile results default tab should be cheapest store

### D-CLARIFY-020: Simple SVG favicon with brand green
- **Who decided**: user
- **What**: Create a simple SVG favicon using brand color #16A34A
- **Why**: Resolves 404 error and adds brand identity
- **Alternatives**: Use a specific icon file, skip favicon
- **Context**: M1 - Missing favicon causing 404

### D-CLARIFY-021: Verify existing unit price handling for M2
- **Who decided**: user
- **What**: Verify current conditional rendering handles missing unit price correctly and call M2 done
- **Why**: Data quality issue from source API, current code already handles null gracefully
- **Alternatives**: Add explicit "unit price not available" text
- **Context**: M2 - Harris Farm bread missing unit price data

## Orchestrate Phase (T018 UI Audit)
_Captured: 2026-03-01T10:00:00Z_

### D-ORCH-005: Scale assessment - MEDIUM (15 issues, 8 tasks)
- **Who decided**: claude
- **What**: Assessed T018 as MEDIUM scale (~8 implementation tasks covering 15 active issues)
- **Why**: 15 issues but many are small frontend tweaks that can be grouped; 2 critical backend issues (B1/B2) are being addressed via B3 resilience approach
- **Alternatives**: SMALL (too few tasks), LARGE (too many tasks)
- **Context**: Scale assessment for workflow planning

### D-ORCH-006: Standard orchestration pattern
- **Who decided**: claude
- **What**: Using STANDARD pattern (sequential execution)
- **Why**: Tasks have dependencies (B3 must come before frontend error states; B4 before F4 savings calculation); not enough independent work to justify parallel
- **Alternatives**: PARALLEL (some frontend fixes could run in parallel), COUNCIL (overkill for bug fixes)
- **Context**: Orchestration pattern selection
