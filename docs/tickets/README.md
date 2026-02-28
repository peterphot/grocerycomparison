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

| Wave | Tickets | Can Start When |
|------|---------|----------------|
| 1 | T001 | Immediately |
| 2 | T002 | T001 done |
| 3 | T003 | T002 done |
| 4 (parallel) | T004, T005, T006, T007, T008 | T003 done (T008 only needs T002) |
| 4 (parallel) | T011 | T001 done |
| 4 (parallel) | T012 | T002 done |
| 5 | T009 | T004 + T005 + T006 + T007 + T008 all done |
| 6 | T010 | T009 done |
| 7 | T013 | T010 + T011 + T012 all done |
| 8 (parallel) | T014, T015 | T013 done |

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
