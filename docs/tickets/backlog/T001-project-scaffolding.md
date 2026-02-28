# T001 — Project Scaffolding

## Status
- [x] Backlog
- [ ] In Progress
- [ ] Completed

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
- [ ] Playwright configured with `playwright.config.ts` pointing at `http://localhost:3000`
- [ ] shadcn/ui initialised in `frontend/` with Tailwind CSS
- [ ] `npm run test` works from repo root (runs both backend and frontend unit tests)
- [ ] `npm run test:e2e` runs Playwright
- [ ] `.gitignore` covers `node_modules`, `.next`, `dist`
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
- `webServer` config to start both frontend (port 3000) and backend (port 4000) before tests

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
