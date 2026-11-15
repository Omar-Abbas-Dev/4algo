# ADR-003: Python Engine IPC & JSON Contract v1

## Status
Accepted

## Context
Search algorithms (BFS, DFS, Greedy, A*) are implemented in Python 3 standard library. The .NET backend needs to execute these algorithms without adding runtime network services or heavy orchestration dependencies.

## Decision
We adopted Process-based Inter-Process Communication (IPC) via standard streams (`stdin` and `stdout`) governed by **Contract v1**:
- Request sent as JSON to Python process `stdin`.
- Response received as JSON from `stdout`.
- Process timeout enforced at 10 seconds.
- Errors written as JSON to `stderr` with non-zero exit code.
- Anti-corruption layer in `NavX.Infrastructure.Engine.EngineContracts` isolates internal domain types from external JSON contracts.
- Caching decorator (`CachedRaceEngine`) computes SHA-256 hash of `grid + start + goal` to cache deterministic results for 1 hour.

## JSON Contract v1 Specification

### Request (stdin):
```json
{
  "contractVersion": 1,
  "grid": [[1, 5, -1], [1, 1, 1]],
  "start": [0, 0],
  "goal": [1, 2]
}
```

### Response (stdout):
```json
{
  "contractVersion": 1,
  "results": [
    {
      "algorithm": "A*",
      "path": [[0, 0], [1, 0], [1, 1], [1, 2]],
      "explored": [[0, 0], [1, 0], [1, 1], [1, 2]],
      "cost": 3,
      "timeMs": 0.04
    }
  ]
}
```
