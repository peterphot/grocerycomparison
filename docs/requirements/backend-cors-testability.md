# Requirements: Backend CORS & Testability Fix

## Status: COMPLETED

## Overview
Fix two issues in the backend Express app: (1) wire up CORS middleware using the `FRONTEND_ORIGIN` env var, and (2) separate app creation from server startup so the app can be imported for testing without starting a listener.

## Requirements

### REQ-1: CORS middleware wired up
- **What**: Import and apply `cors()` middleware to the Express app using `FRONTEND_ORIGIN` from environment variables.
- **Acceptance Criteria**:
  - `cors` is imported and applied as Express middleware
  - The origin is set to `process.env.FRONTEND_ORIGIN`, defaulting to `http://localhost:3000`
  - Simple `cors({ origin: FRONTEND_ORIGIN })` configuration (no credentials, no custom headers)
  - Response to requests from the allowed origin includes correct `Access-Control-Allow-Origin` header
  - Preflight (OPTIONS) requests are handled correctly

### REQ-2: Separate app creation from server startup
- **What**: Split `backend/src/index.ts` into two files:
  - `backend/src/app.ts` -- creates and configures the Express app (CORS, routes, middleware) and exports it
  - `backend/src/index.ts` -- imports app from `app.ts` and calls `app.listen()`
- **Acceptance Criteria**:
  - Importing `app` from `app.ts` does NOT start the server (no `listen()` call)
  - `app.listen()` only runs in `index.ts`
  - The `/api/health` endpoint continues to return `{ status: 'ok' }` with HTTP 200
  - The app can be used with supertest for integration testing

## Edge Cases
- `FRONTEND_ORIGIN` not set in environment: default to `http://localhost:3000`
- Requests from a disallowed origin: CORS headers should not include that origin
- The existing `sample.test.ts` must continue to pass unchanged

## In Scope / Out of Scope

### In Scope
- Wiring up `cors()` middleware with `FRONTEND_ORIGIN`
- Splitting `index.ts` into `app.ts` + `index.ts`
- Writing supertest integration tests for the health endpoint and CORS behavior
- Ensuring all existing tests continue to pass

### Out of Scope
- Adding new API routes
- Changing the `.env.example` file
- Adding CORS credentials, custom headers, or multi-origin support
- Modifying the frontend
- Changing the test framework or test setup
