# T001 — Project Scaffolding

## Status
- [ ] Backlog
- [ ] In Progress
- [x] Completed

## Created
2026-02-28

## Parallelism
- **Can start after**: Nothing — start here
- **Blocks**: T002, T011
- **Parallel with**: Nothing

---

## Summary

Bootstrap the entire monorepo structure with npm workspaces, TypeScript, and all tooling configured.
This is the single foundation ticket — everything else blocks on it.

## Source
- `plan.md` → T001, Section 7 (File/Folder Structure), Section 9.1 (Testing Framework)

---

## Acceptance Criteria

- [ ] npm workspace root with `packages/shared`, `backend/`, `frontend/` packages
- [ ] TypeScript configured: `tsconfig.base.json` at root, extended per-package
- [ ] `backend/` runs with `ts-node` / `tsx`
- [ ] `frontend/` runs with `next dev` on port 3000
- [ ] `backend/` runs on port 4000
- [ ] Vitest configured in `backend/` with a sample passing test
- [ ] Vitest + React Testing Library configured in `frontend/` with a sample passing test
- [ ] msw installed in both `backend/` and `frontend/` dev dependencies; `tests/setup.ts` created in each
- [ ] Playwright configured with `playwright.config.ts` pointing at `http://localhost:3000`
- [ ] shadcn/ui initialised in `frontend/` with Tailwind CSS
- [ ] `npm run test` works from repo root (runs both backend and frontend unit tests)
- [ ] `npm run test:e2e` runs Playwright
- [ ] `.gitignore` covers `node_modules`, `.next`, `dist`, `.env`
- [ ] `backend/.env.example` and `frontend/.env.example` committed
- [ ] `README.md` documents how to run dev, test, and e2e

---

## TDD Requirements

This is a setup ticket — no business logic, so TDD applies to tooling verification:
- [ ] Write a trivial passing unit test in `backend/tests/` to confirm Vitest works
- [ ] Write a trivial passing unit test in `frontend/tests/` to confirm Vitest + RTL works
- [ ] Write a trivial Playwright spec that visits `http://localhost:3000` and confirms the page loads
- [ ] All test commands exit 0 before marking complete

---

## Implementation Notes

### Workspace structure
```
grocerycomparison/
├── package.json              (workspaces: ["packages/*", "backend", "frontend"])
├── tsconfig.base.json        (strict: true, moduleResolution: bundler, target: ES2022)
├── packages/shared/          (shared types — compiled, not bundled)
├── backend/                  (Express + ts-node)
└── frontend/                 (Next.js 14 App Router)
```

### Key dependencies
| Package | Where | Purpose |
|---------|-------|---------|
| `express` | backend | HTTP server |
| `next`, `react`, `react-dom` | frontend | UI framework |
| `typescript` | root dev | type checking |
| `vitest` | backend + frontend dev | unit tests |
| `@testing-library/react` | frontend dev | component tests |
| `@testing-library/user-event` | frontend dev | interaction simulation |
| `msw` | backend + frontend dev | HTTP mocking in tests |
| `supertest` | backend dev | Express integration tests |
| `@playwright/test` | root dev | E2E tests |
| `tailwindcss`, `postcss` | frontend | styling |
| `@types/express`, `@types/node` | backend dev | TS types |

### shadcn/ui init
Run `npx shadcn@latest init` inside `frontend/` — choose: New York style, green primary (#16A34A), CSS variables enabled.

### Playwright config
- `testDir: './e2e'`
- `baseURL: 'http://localhost:3000'`
- `webServer` config to start both frontend (port 3000) and a mock backend (port 4000) before tests

### msw setup
Install msw in both packages. Create handler entrypoints:
- `backend/tests/setup.ts` — `setupServer()` from `msw/node`, export `server` for use in test files
- `frontend/tests/setup.ts` — same pattern, import in `vitest.config.ts` as `setupFilesAfterEach`
Verify msw intercepts work with a trivial test in both packages before marking T001 done.

### Environment variable templates
Create `.env.example` files in each package:

`backend/.env.example`:
```
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
REQUEST_TIMEOUT_MS=10000
COLES_SESSION_TTL_MS=300000
RESULT_CACHE_TTL_MS=30000
MAX_CONCURRENT_PER_STORE=2
```

`frontend/.env.example`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### Root workspace scripts
Root `package.json` must include:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\"",
    "test": "npm run test --workspaces --if-present",
    "test:e2e": "playwright test",
    "build": "npm run build --workspaces --if-present"
  }
}
```
Install `concurrently` as a root dev dependency for the `dev` script.

---

## Files to Create

| File | Description |
|------|-------------|
| `package.json` | Root workspace |
| `tsconfig.base.json` | Shared TS config |
| `.gitignore` | Standard ignores |
| `README.md` | Dev instructions |
| `packages/shared/package.json` | Shared package |
| `packages/shared/tsconfig.json` | Shared TS config |
| `backend/package.json` | Backend package |
| `backend/tsconfig.json` | Backend TS config |
| `backend/src/index.ts` | Express entry point stub |
| `frontend/package.json` | Frontend package |
| `frontend/tsconfig.json` | Frontend TS config |
| `frontend/next.config.js` | Next.js config |
| `frontend/tailwind.config.js` | Tailwind config |
| `playwright.config.ts` | Root Playwright config |
| `e2e/smoke.spec.ts` | Trivial Playwright smoke test |
