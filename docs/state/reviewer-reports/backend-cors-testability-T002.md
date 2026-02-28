# Reviewer Report: T002 - Backend CORS & Testability

## Verdict: APPROVED

## Requirement Compliance
- [x] REQ-1: CORS middleware wired up with FRONTEND_ORIGIN env var (default: http://localhost:3000)
- [x] REQ-2: App creation (app.ts) separated from server startup (index.ts)
- [x] Health endpoint returns 200 with { status: 'ok' }
- [x] App importable without starting server (proven by supertest test file)
- [x] Existing sample.test.ts unchanged and passing

## TDD Compliance
- Tests were written first (T001) before implementation (T002)
- All tests initially failed (red phase) because app.ts did not exist
- Implementation made all tests pass (green phase)
- Every line of app.ts is covered by at least one test assertion

## Test Results
- Test files: 2 passed (2)
- Tests: 6 passed (6)
- sample.test.ts: 1 passing (unchanged)
- app.test.ts: 5 passing (new)

## Files Changed
- `backend/src/app.ts` -- NEW: Express app creation, CORS middleware, health route
- `backend/src/index.ts` -- MODIFIED: now imports app and only calls listen()
- `backend/tests/app.test.ts` -- NEW: 5 supertest integration tests

## Notes
- MSW warnings in test output are expected and harmless (global setup.ts intercepts requests but has no handlers for supertest's local server requests)
- The cors library with a static string origin always emits that string in the header, regardless of the request's Origin. This is correct behavior -- browser enforcement handles the security. Test updated accordingly.

## Reviewed: 2026-02-28T04:10:00Z
