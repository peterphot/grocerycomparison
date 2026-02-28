# Decisions: Backend CORS & Testability Fix

## Summary
This document records the key decisions made while fixing two backend issues: wiring up CORS middleware and separating app creation from server startup for testability.

## Decisions

### D-CLARIFY-010: Single-origin CORS configuration
- **Who decided**: user
- **What**: Use a single `FRONTEND_ORIGIN` value for CORS (not comma-separated multi-origin)
- **Why**: Keep it simple for v1
- **Alternatives**: Comma-separated list of origins, wildcard

### D-CLARIFY-011: Default cors() options only
- **Who decided**: user
- **What**: Use `cors({ origin: FRONTEND_ORIGIN })` with no additional options
- **Why**: No current need for credentials or custom headers
- **Alternatives**: `credentials: true`, specific allowed methods/headers

### D-CLARIFY-012: Keep sample test, add new test file
- **Who decided**: user
- **What**: Keep `sample.test.ts` unchanged; add supertest tests in `app.test.ts`
- **Why**: Existing test provides baseline sanity check; new tests belong in their own file
- **Alternatives**: Replace sample test, merge into one file

### D-ORCH-003: SMALL scale assessment
- **Who decided**: claude
- **What**: Assessed as SMALL scale (2 tightly-scoped tasks)
- **Why**: Both issues well-defined, minimal files affected, no architecture changes

### D-ORCH-004: STANDARD sequential pattern
- **Who decided**: claude
- **What**: Sequential execution, no parallelism
- **Why**: Only 2 tightly-coupled tasks; parallel execution offers no benefit

## Implementation Notes

### CORS behavior with static string origin
The `cors` library, when configured with a static string origin (`cors({ origin: 'http://localhost:3000' })`), always sets the `Access-Control-Allow-Origin` header to that string regardless of the incoming `Origin` header. This is secure because browsers enforce CORS client-side: if the response's `Access-Control-Allow-Origin` does not match the page's origin, the browser blocks the response. The test for disallowed origins verifies that the configured origin is returned (not the attacker's origin).

### MSW warnings in test output
The global MSW `setupServer()` in `tests/setup.ts` intercepts HTTP requests but has no handlers for the supertest integration tests (which make real HTTP requests to a local server created by supertest). The MSW warnings in test output are expected and harmless.
