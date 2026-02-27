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
