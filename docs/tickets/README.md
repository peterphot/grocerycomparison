# Ticket Index — GroceryComparison

## Dependency Graph

```
T001 (Project Scaffolding)
  └─► T002 (Shared Types)
        └─► T003 (Backend Utilities)
              ├─► T004 (Woolworths Adapter) ─────────────┐
              ├─► T005 (Coles Adapter)      ─────────────┤
              ├─► T006 (Aldi Adapter)       ─────────────┼─► T009 (Search Orchestrator)
              ├─► T007 (Harris Farm Adapter)─────────────┤       └─► T010 (Express Server & API)
              └─► T008 (Result Builder)     ─────────────┘                   │
                                                                              ▼
T001 ──► T011 (Shopping List Form) ──────────────────────────────► T013 (Page Integration)
T002 ──► T012 (Comparison Results) ──────────────────────────────►      │
                                                                         ▼
                                                               T014 (Playwright E2E)
                                                               T015 (Error Handling & Polish)
```

## Parallelism Summary

> Note: T011 and T012 can begin much earlier than T004–T008 since they only need scaffolding and
> types respectively. A team can start frontend work immediately after T002, fully in parallel
> with all backend adapter work.

| Wave | Tickets | Can Start When | Notes |
|------|---------|----------------|-------|
| 1 | T001 | Immediately | Unblocks everything |
| 2 | T002 | T001 done | Unblocks backend + frontend results |
| 2 (parallel) | T011 | T001 done | Shopping list form — no backend needed |
| 3 | T003 | T002 done | Unblocks all adapters |
| 3 (parallel) | T008 | T002 done | Result builder is pure logic, no adapters needed |
| 3 (parallel) | T012 | T002 done | Results components use mock data, no backend needed |
| 4 (parallel) | T004, T005, T006, T007 | T003 done | All 4 adapters fully independent of each other |
| 5 | T009 | T004+T005+T006+T007+T008 all done | Orchestrates all adapters |
| 6 | T010 | T009 done | Wires server; T011+T012 continue in parallel |
| 7 | T013 | T010+T011+T012 all done | Integration point |
| 8 (parallel) | T014, T015 | T013 done | E2E + polish run concurrently |

## All Tickets

| ID | Title | Phase | Parallel With | Blocks |
|----|-------|-------|---------------|--------|
| [T001](backlog/T001-project-scaffolding.md) | Project Scaffolding | 1 - Setup | — | T002, T011 |
| [T002](backlog/T002-shared-types.md) | Shared Types Package | 2 - Foundation | — | T003, T008, T012 |
| [T003](backlog/T003-backend-utilities.md) | Backend Utilities | 3 - Foundation | — | T004–T007 |
| [T004](backlog/T004-woolworths-adapter.md) | Woolworths Adapter | 4 - Adapters | T005, T006, T007, T008 | T009 |
| [T005](backlog/T005-coles-adapter.md) | Coles Adapter | 4 - Adapters | T004, T006, T007, T008 | T009 |
| [T006](backlog/T006-aldi-adapter.md) | Aldi Adapter | 4 - Adapters | T004, T005, T007, T008 | T009 |
| [T007](backlog/T007-harris-farm-adapter.md) | Harris Farm Adapter | 4 - Adapters | T004, T005, T006, T008 | T009 |
| [T008](backlog/T008-result-builder.md) | Result Builder | 4 - Logic | T004, T005, T006, T007 | T009 |
| [T009](backlog/T009-search-orchestrator.md) | Search Orchestrator | 5 - Orchestration | — | T010 |
| [T010](backlog/T010-express-server-api-route.md) | Express Server & Search API | 6 - API | — | T013 |
| [T011](backlog/T011-shopping-list-form.md) | Shopping List Form | 4 - Frontend | T004–T008, T012 | T013 |
| [T012](backlog/T012-comparison-results-components.md) | Comparison Results Components | 4 - Frontend | T004–T008, T011 | T013 |
| [T013](backlog/T013-page-integration.md) | Page Integration & API Client | 7 - Integration | — | T014, T015 |
| [T014](backlog/T014-playwright-e2e.md) | Playwright E2E Tests | 8 - QA | T015 | — |
| [T015](backlog/T015-error-handling-polish.md) | Error Handling & Polish | 8 - QA | T014 | — |
| [T016](backlog/T016-e2e-coverage-improvements.md) | E2E Test Coverage Improvements | 9 - QA Hardening | — | — |
| [T017](backlog/T017-ui-design-alignment.md) | UI Design Alignment | 10 - Polish | — | — |
