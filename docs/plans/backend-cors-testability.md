# Plan: Backend CORS & Testability Fix

## Overview
Fix two issues in the backend: (1) wire up the `cors` middleware that is already a dependency but never imported/used, and (2) separate Express app creation from `app.listen()` so the app can be imported for testing without starting a server.

## Architecture Impact
- **Files created**: `backend/src/app.ts`, `backend/tests/app.test.ts`
- **Files modified**: `backend/src/index.ts`
- **Files unchanged**: `backend/package.json` (deps already present), `backend/.env.example`, `backend/tests/sample.test.ts`, `backend/tests/setup.ts`, `backend/vitest.config.ts`

## Task Breakdown

### [T001] Test: Write supertest integration tests for app
- **Type**: Test
- **Description**: Create `backend/tests/app.test.ts` with failing tests that verify:
  1. GET `/api/health` returns 200 with `{ status: 'ok' }`
  2. Requests from allowed origin receive correct `Access-Control-Allow-Origin` header
  3. Preflight OPTIONS request to `/api/health` returns CORS headers
  4. The app module can be imported without starting a server (implicit -- if the test file can import and use supertest with the app, it proves no server starts on import)
- **Dependencies**: None
- **Acceptance**: Tests are written, all FAIL (red phase of TDD) because `app.ts` does not exist yet

### [T002] Implement: Create app.ts, refactor index.ts, wire CORS
- **Type**: Implement
- **Description**:
  1. Create `backend/src/app.ts` that:
     - Imports express and cors
     - Creates the app
     - Applies `cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000' })`
     - Registers the `/api/health` route
     - Exports the app (default export)
  2. Refactor `backend/src/index.ts` to:
     - Import app from `./app`
     - Call `app.listen()` with PORT from env
     - Remove all route/middleware setup (now in app.ts)
- **Dependencies**: T001 (tests must exist first)
- **Acceptance**: All tests from T001 pass (green phase of TDD), plus existing `sample.test.ts` still passes

## Notes
- `cors` and `@types/cors` are already in `backend/package.json` -- no dependency installation needed
- `supertest` and `@types/supertest` are already in devDependencies -- no installation needed
- The backend `tsconfig.json` uses `CommonJS` module output and `node` moduleResolution, so standard imports will work
