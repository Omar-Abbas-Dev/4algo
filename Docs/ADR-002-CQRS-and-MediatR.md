# ADR-002: CQRS & Pipeline Behaviors

## Status
Accepted

## Context
Use cases in NavX Arena span transactional operations (running a race, saving/deleting maps) and read-only queries (fetching race history, viewing replays, calculating statistics).

## Decision
We implemented CQRS using MediatR:
- **Commands**: Modify system state. E.g., `RunRaceCommand`, `SaveMapCommand`, `DeleteMapCommand`.
- **Queries**: Read-only with no side effects (`AsNoTracking`). E.g., `GetRaceHistoryQuery`, `GetStatsQuery`, `GetReplayQuery`.

### Pipeline Behavior Execution Order:
```
Request
  └── LoggingBehavior
        └── ValidationBehavior (FluentValidation)
              └── CachingBehavior (ICacheableQuery)
                    └── Command/Query Handler
                          └── CacheInvalidationBehavior (ICacheInvalidatingCommand)
```

## Consequences
- Single Responsibility: Each use case has a dedicated handler under 30 lines.
- Automatic caching for queries and immediate invalidation upon state modifications.
