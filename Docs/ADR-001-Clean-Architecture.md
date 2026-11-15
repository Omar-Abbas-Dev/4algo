# ADR-001: Clean Architecture Implementation

## Status
Accepted

## Context
NavX Arena requires a scalable, decoupled architecture supporting a hybrid .NET Web API, Python algorithm execution engine, and React frontend. The application models a competitive race between 4 search algorithms (BFS, DFS, Greedy, A*) on city road grids.

## Decision
We adopted Clean Architecture with strict inward dependency rules:
1. **NavX.Domain (Layer 1)**: Pure business models, Value Objects (`Position`, `Grid`), Entities (`Race`, `AlgorithmResult`, `SavedMap`), and domain policies (`WinnerPolicy`). Free from external framework dependencies.
2. **NavX.Application (Layer 2)**: CQRS use cases with MediatR, FluentValidation pipeline behaviors, query caching, and cache invalidation. Defines port abstractions (`IRaceEngine`, `IUnitOfWork`, `IRaceRepository`, `IMapRepository`, `ICacheService`).
3. **NavX.Infrastructure (Layer 3)**: Implements persistence with EF Core & SQLite, caching with `MemoryCacheService`, audio sonification synthesis with NAudio, and Python engine communication via `PythonRaceEngine` and `CachedRaceEngine` (Decorator).
4. **NavX.Api (Layer 4)**: Composition root and presentation layer exposing RESTful endpoints, Swagger documentation, and RFC 7807 `ProblemDetails` exception handling.
5. **NavX.AlgorithmEngine (Layer 5)**: Standalone Python 3 engine executing search strategies in isolation and communicating via Contract v1 over standard I/O streams.

## Consequences
- Total testability: Core rules and use cases are tested independently of UI and database.
- Verified by automated NetArchTest architecture tests in `NavX.ArchitectureTests`.
