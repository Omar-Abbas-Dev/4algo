# NavX Arena — Project Build Plan

> Implementation plan only (no complete source code). The goal is to build a clean, well-structured **Clean Architecture** project across three main technologies: **C# (the primary backend)** + **Python (the algorithm engine)** + **React (the UI)**.

---

## 1. Overview

**Project idea:** Four search algorithms (BFS, DFS, Greedy, and A*) race simultaneously across the same city map. Each algorithm has its own color, car, and distinctive sound. A live scoreboard displays Cost, the number of explored cells, and execution time. The winner is the algorithm with the lowest Fuel Cost.

**Map Model:**

| Value | Meaning | Cost |
|---|---|---:|
| `1` | Open road | 1 |
| `5` | Traffic congestion | 5 |
| `-1` | Blocked road | Cannot be traversed |

Movement is allowed in four directions. The heuristic is Manhattan distance, which is admissible because the minimum cost of a move is 1.

**Technology Stack:**

| Layer | Technology |
|---|---|
| UI | React + TypeScript + Vite |
| Primary Backend | ASP.NET Core Web API (C#) |
| Engine | Python 3 (standard library only) |
| Database | SQLite through EF Core |
| API Documentation | Swagger (Swashbuckle) |

---

## 2. Architectural Decisions

| Topic | Decision | Reason |
|---|---|---|
| Architecture style | Clean Architecture | Dependencies point inward only; the Domain layer knows nothing about external layers |
| C# architecture | 4 layers: Domain, Application, Infrastructure, API | Required project structure |
| Fifth layer | Python Engine | Communicates with C# through a defined JSON contract |
| CQRS | Separate Commands and Queries (MediatR) | Each use case has its own handler |
| Validation | FluentValidation through a Pipeline Behavior | Controllers and handlers do not receive invalid requests |
| Mapping | AutoMapper (Entity ↔ DTO) | Profiles are located in the Application layer |
| Persistence | Repositories + Unit of Work over EF Core | The Application layer does not depend on EF Core |
| Caching | `ICacheService` + Pipeline Behavior for Queries + Engine Decorator | Explained in Section 8 |
| Controllers | Thin: one or two lines | All application logic belongs in handlers |
| Dependency Injection | `AddApplication()` / `AddInfrastructure()` / `AddPresentation()` | Keeps `Program.cs` small |
| Python integration | Process + JSON over stdin/stdout | No separate server or additional runtime dependencies |
| API documentation | Swagger + XML comments | Demonstrated during the project presentation |

> **Licensing note:** MediatR (from v13) and AutoMapper (from v15) moved to dual licensing (RPL-1.5 or commercial). They offer a free Community edition for education, non-production use, and companies with less than $5 million in revenue. A university project should qualify, but **read their licensing terms before installing them**. To avoid these licensing considerations, use `Mediator` (MIT, source-generated) instead of MediatR, and `Mapperly` (Apache 2.0) instead of AutoMapper. An important distinction: AutoMapper `14.0.0` (the last MIT-licensed version) has a known DoS vulnerability, so do not use it. Keep the use of either mapping/mediator library behind the `IMapper` and `ISender` abstractions so that replacing them remains straightforward.
>
> FluentAssertions also became commercially licensed from v8 onward, so use **Shouldly** for tests.

**Important warning:** This is a small application, and the architecture is intentionally more sophisticated than the project strictly requires in order to demonstrate engineering skills. The rule is: **every abstraction must have a real purpose**. Do not create an interface for a component that will never have another implementation, unless it is needed for mocking in tests.

---

## 3. Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│  Frontend (React + TS) — Clean Architecture with 4 layers   │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTP / JSON (Swagger contract)
┌────────────────────────────▼─────────────────────────────────┐
│ Layer 4: NavX.Api             Controllers, Swagger,          │
│                               Exception handling, Program    │
├──────────────────────────────────────────────────────────────┤
│ Layer 3: NavX.Infrastructure  EF Core, Repositories, UoW,    │
│                               Cache, PythonRaceEngine        │
├──────────────────────────────────────────────────────────────┤
│ Layer 2: NavX.Application     CQRS, Behaviors, Validators,   │
│                               DTOs, Mappings, Interfaces     │
├──────────────────────────────────────────────────────────────┤
│ Layer 1: NavX.Domain          Entities, Value Objects,       │
│                               Domain rules (no dependencies) │
└────────────────────────────┬─────────────────────────────────┘
                             │ Process + JSON Contract v1
┌────────────────────────────▼─────────────────────────────────┐
│ Layer 5: Python Engine       domain / application / adapters │
│                               BFS · DFS · Greedy · A*         │
└──────────────────────────────────────────────────────────────┘
```

**Dependency Rule:**

```text
Api ──▶ Application ──▶ Domain
Api ──▶ Infrastructure ──▶ Application ──▶ Domain
```

- `Domain` does not depend on anything.
- `Application` depends only on `Domain` and defines interfaces such as `IRaceEngine` and `IUnitOfWork`.
- `Infrastructure` implements those interfaces.
- `Api` is the Composition Root: it wires everything together and contains no business logic.

---

## 4. Solution Structure

```text
navx-arena/
├── NavX.sln
├── src/
│   ├── NavX.Domain/
│   │   ├── Common/                 Entity, ValueObject, IAggregateRoot
│   │   ├── Entities/               Race, AlgorithmResult, SavedMap
│   │   ├── ValueObjects/           Position, Grid
│   │   ├── Enums/                  AlgorithmType, CellType
│   │   ├── Services/               WinnerPolicy
│   │   └── Exceptions/             DomainException, InvalidGridException
│   │
│   ├── NavX.Application/
│   │   ├── Abstractions/           IRaceEngine, IUnitOfWork, IRaceRepository,
│   │   │                           IMapRepository, ICacheService
│   │   ├── Behaviors/              Logging, Validation, Caching, CacheInvalidation
│   │   ├── Common/                 PagedResult<T>, ICacheableQuery, ICacheInvalidatingCommand
│   │   ├── Dtos/                   RaceResultDto, AlgorithmResultDto, MapDto, StatsDto
│   │   ├── Mappings/               RaceProfile, MapProfile
│   │   ├── Races/
│   │   │   ├── Commands/RunRace/       Command, Handler, Validator
│   │   │   └── Queries/               GetRaceById, GetRaceHistory, GetReplay
│   │   ├── Maps/
│   │   │   ├── Commands/               SaveMap, DeleteMap
│   │   │   └── Queries/                GetMaps, GetMapById
│   │   ├── Stats/Queries/GetStats/
│   │   └── DependencyInjection.cs
│   │
│   ├── NavX.Infrastructure/
│   │   ├── Persistence/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Configurations/         IEntityTypeConfiguration for each entity
│   │   │   ├── Repositories/           Repository<T>, RaceRepository, MapRepository
│   │   │   ├── UnitOfWork.cs
│   │   │   └── Migrations/
│   │   ├── Engine/
│   │   │   ├── PythonRaceEngine.cs
│   │   │   ├── CachedRaceEngine.cs     Decorator
│   │   │   ├── EngineContracts.cs      Request/Response records (JSON v1)
│   │   │   └── PythonEngineOptions.cs
│   │   ├── Caching/MemoryCacheService.cs
│   │   └── DependencyInjection.cs
│   │
│   └── NavX.Api/
│       ├── Controllers/                ApiControllerBase, Races, Maps, Stats
│       ├── ExceptionHandling/          GlobalExceptionHandler (ProblemDetails)
│       ├── Swagger/                    SwaggerExtensions, Examples
│       ├── DependencyInjection.cs      AddPresentation()
│       ├── appsettings.json
│       └── Program.cs
│
├── tests/
│   ├── NavX.Domain.Tests/
│   ├── NavX.Application.Tests/
│   ├── NavX.Api.IntegrationTests/
│   └── NavX.ArchitectureTests/         Automatically verifies dependency rules
│
├── python-engine/                      (Section 12)
├── frontend/                           (Section 13)
└── docs/                               Diagrams, ADRs
```

---

## 5. Layer Details

### 5.1 Domain (Layer 1)

| Element | Description |
|---|---|
| `Position` | `record struct (Row, Col)` |
| `Grid` | Value Object: verifies that the map is rectangular and that every value is `1`, `5`, or `-1`. Provides `Contains(Position)` and `CostAt(Position)` |
| `Race` | Aggregate Root: `Id`, `CreatedAtUtc`, `Grid`, `Start`, `Goal`, `Results`, `Winner`. Created through `Race.Create(...)` (factory), and determines the winner itself |
| `AlgorithmResult` | `Algorithm`, `Cost?`, `Path`, `ExploredCount`, `TimeMs` |
| `SavedMap` | `Id`, `Name`, `Grid`, `CreatedAtUtc` |
| `WinnerPolicy` | Lowest Cost wins; in case of a tie, the lowest `ExploredCount` wins. If no algorithm has a Cost, the winner is `null` |

**The difference between Validation and Domain rules:**

- FluentValidation validates the request shape (size, range, and type).
- Domain invariants ensure that an entity can never enter an invalid state, even if it is created from another part of the application.

### 5.2 Application (Layer 2)

**Interfaces defined by this layer:**

| Interface | Responsibility |
|---|---|
| `IRaceEngine` | `RunAsync(grid, start, goal, ct)` returns the complete result, including explored cells |
| `IUnitOfWork` | `Races`, `Maps`, `SaveChangesAsync(ct)` |
| `IRaceRepository` | `AddAsync`, `GetByIdAsync`, `GetHistoryAsync(page, size)`, `GetWinCountsAsync` |
| `IMapRepository` | Map CRUD operations |
| `ICacheService` | `GetOrCreateAsync`, `RemoveAsync`, `RemoveByPrefixAsync` |

**A single Handler:** Handles one use case and should ideally be fewer than 30 lines. Example: `RunRaceCommandHandler`:

1. `engine.RunAsync(...)` (caching is handled inside the Decorator).
2. `Race.Create(...)`.
3. `uow.Races.AddAsync(race)` followed by `uow.SaveChangesAsync()`.
4. `mapper.Map<RaceResultDto>(...)`, then adds the explored cells to the DTO (they are not persisted).

> **Design decision:** Explored cells (`explored`) are **not stored in the database** (there may be up to 2,500 × 4). Instead, they are returned in the `POST /api/races` response for the animation. To replay an old race, `GET /api/races/{id}/replay` runs it again (the algorithms are deterministic).

### 5.3 Infrastructure (Layer 3)

- **EF Core + SQLite:** The Grid and Path are stored as JSON columns (using a Value Converter), while `AlgorithmResult` is stored as an owned collection.
- **Repositories:** A generic `Repository<T>` (`GetById`, `Add`, `Remove`) plus specialized repositories. **Do not expose `IQueryable` outside the Repository.**
- **UnitOfWork:** Wraps `AppDbContext` and exposes the repositories and `SaveChangesAsync`. It is registered as Scoped so the same `DbContext` instance is shared.
- **PythonRaceEngine:** Starts the process, sends JSON through stdin, and reads the result. It has a 10-second timeout and throws a clear exception if the exit code is non-zero.
- **EngineContracts:** JSON records (anti-corruption layer) that are converted into Application models through a small mapper, **not AutoMapper**.
- **CachedRaceEngine:** Decorator around `PythonRaceEngine`.
- **MemoryCacheService:** Implements `ICacheService` using `IMemoryCache`.

### 5.4 API (Layer 4)

- Thin controllers that inherit from `ApiControllerBase` (which contains `ISender`).
- `GlobalExceptionHandler` converts errors into `ProblemDetails`.
- Swagger + XML comments.
- `Program.cs` should be fewer than 40 lines.

---

## 6. CQRS

### 6.1 Commands and Queries

| Type | Name | Endpoint | Notes |
|---|---|---|---|
| Command | `RunRaceCommand` | `POST /api/races` | Runs the engine and saves the race; **invalidates** the stats and history caches |
| Command | `SaveMapCommand` | `POST /api/maps` | Invalidates the `maps:*` cache |
| Command | `DeleteMapCommand` | `DELETE /api/maps/{id}` | Invalidates the `maps:*` cache |
| Query | `GetRaceByIdQuery` | `GET /api/races/{id}` | |
| Query | `GetRaceHistoryQuery` | `GET /api/races?page=&pageSize=` | Cached |
| Query | `GetReplayQuery` | `GET /api/races/{id}/replay` | Cached; returns explored cells |
| Query | `GetStatsQuery` | `GET /api/stats` | Cached |
| Query | `GetMapsQuery` | `GET /api/maps` | Cached |
| Query | `GetMapByIdQuery` | `GET /api/maps/{id}` | |

Separation rule: a **Command changes state and does not return display data** (the intentional exception is `RunRace`, which returns the result because the UI needs it immediately). A **Query** only reads data (`AsNoTracking`) and does not change anything.

### 6.2 Pipeline (Behavior Order)

```text
Request ─▶ LoggingBehavior
        ─▶ ValidationBehavior       (FluentValidation → ValidationException)
        ─▶ CachingBehavior          (for Queries implementing ICacheableQuery)
        ─▶ Handler
        ─▶ CacheInvalidationBehavior (after successful Commands implementing ICacheInvalidatingCommand)
```

### 6.3 Lifecycle of a Request (`POST /api/races`)

```text
React ─▶ RacesController.Create(request)          [one line: sender.Send(command)]
      ─▶ ValidationBehavior                       [400 if invalid]
      ─▶ RunRaceCommandHandler
            ├─▶ IRaceEngine (CachedRaceEngine ─▶ PythonRaceEngine ─▶ engine.py)
            ├─▶ Race.Create(...)                  [Domain: invariants + winner]
            ├─▶ IUnitOfWork.Races.AddAsync + SaveChangesAsync
            └─▶ IMapper.Map<RaceResultDto>
      ─▶ CacheInvalidationBehavior                [stats, history]
      ◀─ 201 Created + RaceResultDto
```

---

## 7. Validation (FluentValidation)

`RunRaceCommandValidator` verifies:

- The number of rows and columns is between 2 and 50, and all rows have the same length.
- Every cell is `1`, `5`, or `-1`.
- `Start` and `Goal` are each `[row, col]` coordinates inside the map.
- `Start ≠ Goal`.
- (Optional) The Start and Goal cells are not `-1`.

**Principles:**

- **One Validator per Command/Query, in the same folder.**
- Error messages must be clear and written in English (they are displayed in the UI).
- Errors return `400` with `ValidationProblemDetails` (containing an `errors` entry for each field).
- Validators are registered automatically using `AddValidatorsFromAssembly(...)`.

---

## 8. Caching

| Location | Mechanism | Key | Duration | Invalidated by |
|---|---|---|---|---|
| Engine result | `CachedRaceEngine` (Decorator) | `engine:` + SHA-256 of (grid + start + goal) | 1 hour | Expiration |
| Stats | `CachingBehavior` | `stats` | 30 seconds | `RunRaceCommand` |
| History | `CachingBehavior` | `history:{page}:{size}` | 30 seconds | `RunRaceCommand` |
| Map list | `CachingBehavior` | `maps:list` | 5 minutes | `SaveMap` and `DeleteMap` |

**Notes:**

- The algorithms are deterministic, so the same input produces the same result. This makes engine caching safe.
- The cached `timeMs` is the execution time from the first run. Add `fromCache: true` to the DTO so the UI can indicate this instead of making it appear that execution time has become zero.
- The interfaces are `ICacheableQuery { string CacheKey; TimeSpan? Duration }` and `ICacheInvalidatingCommand { IReadOnlyList<string> PrefixesToEvict }`.
- If the target is .NET 9 or later, consider **HybridCache** (which supports cache tags) instead of managing keys manually.
- Redis can replace in-memory caching later by changing only one implementation.

---

## 9. DTOs and AutoMapper

**There are three types of models. Do not mix them:**

| Type | Location | Example |
|---|---|---|
| Request/Command | Application | `RunRaceCommand(int[][] Grid, int[] Start, int[] Goal)` |
| Domain Entity | Domain | `Race`, `Grid`, `Position` |
| Response DTO | Application/Dtos | `RaceResultDto`, `AlgorithmResultDto`, `StatsDto`, `MapDto`, `PagedResult<T>` |

- Use `records` for DTOs and Commands (immutable).
- **Entities must never be returned directly from the API.**
- AutoMapper Profiles (`RaceProfile`, `MapProfile`) belong in `Application/Mappings`. Run `AssertConfigurationIsValid()` in a test so missing mappings are detected.
- Python JSON **must not be mapped using AutoMapper**; its contract is separate and belongs in Infrastructure.

---

## 10. Dependency Injection Containers and Swagger

### 10.1 Dependency Injection

```csharp
Program.cs
  builder.Services
      .AddApplication()                    // MediatR, AutoMapper, Validators, Behaviors
      .AddInfrastructure(builder.Configuration)  // DbContext, Repos, UoW, Cache, Engine
      .AddPresentation();                  // Controllers, Swagger, ExceptionHandler, CORS
```

| Lifetime | Types |
|---|---|
| Singleton | `ICacheService`, Options |
| Scoped | `DbContext`, `IUnitOfWork`, `IRaceRepository`, `IMapRepository`, `IRaceEngine` |
| Transient | Validators, Behaviors (registered by the libraries) |

- Options pattern: `PythonEngineOptions` (`Executable`, `EnginePath`, `TimeoutSeconds`) is loaded from `appsettings.json` and validated with `ValidateOnStart()`.
- **Constructor injection only**; no `ServiceLocator`.
- Decorator registration:

```csharp
services.AddScoped<PythonRaceEngine>();
services.AddScoped<IRaceEngine>(sp => new CachedRaceEngine(
    sp.GetRequiredService<PythonRaceEngine>(),
    sp.GetRequiredService<ICacheService>()));
```

### 10.2 Swagger

- Use the `Swashbuckle.AspNetCore` package.
- Set `GenerateDocumentationFile=true` so XML comments appear.
- Add `[ProducesResponseType]` to every Action (200/201/400/404/500) and use `ProblemDetails` for errors.
- Provide API information: Title / Version / Description.
- Include sample requests (with a ready-to-use map) so the review panel can test the API directly through Swagger.
- After startup, `GET /swagger/v1/swagger.json` is the contract used to generate the frontend types (Section 13).

---

## 11. Controllers and API

**Thin Controller example:**

```csharp
[ApiController]
[Route("api/races")]
public sealed class RacesController(ISender sender) : ApiControllerBase(sender)
{
    /// <summary>Runs BFS, DFS, Greedy and A* on the same map.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(RaceResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RaceResultDto>> Create(RunRaceCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}
```

**Rules:**

- Not allowed inside a Controller: `if`, `try/catch`, mapping, database access, or business logic.
- Include a `CancellationToken` in every Action.
- All errors are handled by `GlobalExceptionHandler`:

| Exception | Response |
|---|---|
| `ValidationException` | 400 + `ValidationProblemDetails` |
| `NotFoundException` | 404 |
| `DomainException` | 422 |
| `TimeoutException` (engine) | 504 |
| Any other exception | 500 (without exposing internal details) |

**Endpoints:** `POST/GET /api/races` · `GET /api/races/{id}` · `GET /api/races/{id}/replay` · `GET /api/stats` · `GET/POST /api/maps` · `GET/DELETE /api/maps/{id}` · `GET /health`

---

## 12. Python Engine (Layer 5) — Clean Architecture

```text
python-engine/
├── engine/
│   ├── domain/
│   │   ├── grid.py                Grid, neighbors(), cost
│   │   ├── search.py              SearchResult (dataclass) + SearchAlgorithm (Protocol)
│   │   ├── heuristics.py          manhattan()
│   │   └── algorithms/
│   │       ├── bfs.py   dfs.py   greedy.py   a_star.py
│   ├── application/
│   │   ├── registry.py            name → algorithm (Strategy)
│   │   └── run_race.py            Use case: runs all four and measures execution time
│   └── adapters/
│       ├── json_io.py             Parse/serialize Contract v1
│       └── cli.py                 stdin → use case → stdout
├── main.py                        Composition root
└── tests/                         pytest
```

**Rules:**

- Keep the algorithms as simple as possible. Each algorithm lives in its own file and follows the same signature.
- `domain` contains no I/O or JSON.
- Adding a new algorithm = one new file + one line in `registry.py` (Open/Closed Principle).
- No third-party runtime libraries; `pytest` is used for development only.
- Add type hints to every function.

**JSON Contract (v1):**

```jsonc
// Request (stdin)
{ "contractVersion": 1, "grid": [[1,5,-1],[1,1,1]], "start": [0,0], "goal": [1,2] }

// Response (stdout)
{ "contractVersion": 1,
  "results": [
    { "algorithm": "A*", "path": [[0,0],[1,0]], "explored": [[0,0]], "cost": 7, "timeMs": 0.02 }
  ] }

// Error: exit code != 0 + JSON message on stderr: { "error": "..." }
```

> The existing prototype (`algorithms.py` + `engine.py`) is the starting point. Move its code into this structure.

---

## 13. Frontend (React) — Clean Architecture

**Professional UI Stack:**

| Area | Choice |
|---|---|
| Foundation | React + TypeScript + Vite |
| Styling and components | Tailwind CSS + shadcn/ui (Radix) |
| Animation | Framer Motion (for the interface); the race itself runs on Canvas |
| Server state | TanStack Query |
| Client state | Zustand |
| Validation | Zod |
| Audio playback | Browser Web Audio API |
| Race rendering | Canvas 2D; optionally upgrade to PixiJS if performance requires it |
| Charts | Recharts |
| Testing | Vitest + React Testing Library |
| Types | `openapi-typescript` generated from `swagger.json` |

**Layers:**

```text
frontend/src/
├── domain/                 Pure types and rules (no React or fetch)
│   ├── models/             Cell, Position, AlgorithmName, RaceResult, ...
│   └── rules/              gridFactory, randomMap, ...
├── application/            Use cases + Ports
│   ├── ports/              RaceGateway, MapGateway, SoundPlayer
│   ├── useCases/           runRace, saveMap, loadStats
│   └── services/           RaceAnimator (animation logic; time is injected)
├── infrastructure/         Port adapters
│   ├── api/                httpClient, HttpRaceGateway, generated types, mappers
│   └── audio/              BrowserSoundPlayer, soundMap
├── presentation/           UI
│   ├── components/         GridCanvas, Toolbox, Scoreboard, RaceControls, ...
│   ├── pages/              ArenaPage, StatsPage
│   └── hooks/              useRace, useGridPainter
└── app/                    Composition root: container.ts, providers.tsx, main.tsx
```

**Rules:**

- Follow the same dependency rule: `presentation → application → domain`; `infrastructure` implements the ports.
- **Do not put `fetch` or `AudioContext` inside a Component or Use Case**; keep them in Infrastructure.
- Keep Dependency Injection simple: the Composition Root in `app/container.ts` creates the adapters and injects them into the use cases, exposed through React Context. An IoC library is unnecessary.
- Store each algorithm's sound settings (Waveform + Pan) together as data in `soundMap.ts`, rather than scattering them throughout the code.
- Components are responsible for presentation only.

---

## 14. Audio Design — Sonification

The application itself generates sound effects in response to events occurring during the race. This is **Sonification**: the algorithm can be heard as well as seen. The race is therefore both visual and auditory. Each algorithm has a recognizable audio identity, allowing users to distinguish them even without looking at the screen.

### 14.1 Distinctive Sound Identity for Each Algorithm

| Algorithm | Waveform | Pan (Stereo Position) | Audio Character |
|---|---|---|---|
| BFS | Sine (smooth) | Left | Calm, regular pulses |
| DFS | Square (sharp) | Slightly left | Descending tones |
| Greedy | Triangle | Slightly right | Fast and impulsive |
| A* | Sawtooth | Right | Intelligent and balanced |

### 14.2 Event-to-Sound Mapping

| Application Event | Sound Effect |
|---|---|
| Drawing an open road | Soft click |
| Drawing a traffic cell | Low, muted honk |
| Drawing a blocked cell | Heavy thud |
| Placing the Start point | Upward-rising tone |
| Placing the Goal point | Downward-falling tone |
| Countdown | Three evenly spaced beeps, followed by a higher-pitched **“GO”** beep |
| A cell is explored | Short tick; the pitch **increases as the algorithm gets closer to the goal**, based on heuristic value `h` |
| A car enters traffic | The sound drops in pitch and becomes heavier |
| A car reaches the goal | Short arpeggio with a distinct character for each algorithm |
| Winner (lowest Cost) | Fanfare |
| No path found | Two descending error tones |

### 14.3 Dramatic Race Audio Moment

In many cases, Greedy may reach the goal first in terms of execution time, while A* may win based on Cost. Make the first algorithm to arrive play a normal arrival sound, and reserve the fanfare for the algorithm with the lowest Cost. The review panel should understand the distinction without needing a lengthy explanation.

### 14.4 Recommended C# Audio Library: NAudio

<badge color="success">Recommended for C# audio generation</badge>

Use **NAudio** as the primary .NET audio library for generating the project's sound effects in C#.

- NAudio is a widely used .NET audio library and provides low-level audio APIs suitable for generating and processing audio.
- Use its signal-generation capabilities to create the required waveforms: Sine, Square, Triangle, and Sawtooth.
- Generate short sound effects such as clicks, ticks, beeps, honks, thuds, descending tones, arpeggios, and the winner fanfare.
- Use stereo audio and channel-volume/panning capabilities to give each algorithm its own spatial identity.
- Use `WaveFileWriter` to export generated effects as WAV files.
- Keep audio generation behind an abstraction such as `ISoundEffectGenerator`, with a NAudio-based implementation such as `NAudioSoundEffectGenerator`.

**Important architecture decision:** The main application is a web application: React runs in the user's browser, while C# runs on the backend. NAudio can generate the audio in C#, but it should not be treated as a browser audio player. A practical approach is to generate the sound-effect WAV assets in C# (either ahead of time or when the application initializes), make those assets available to the frontend, and let the browser play them through the Web Audio API. This keeps sound generation in C# while leaving browser playback in the frontend, where it belongs.

For sounds whose pitch changes dynamically according to the heuristic `h`, either generate a small set of pitch variants in C# or send the relevant event/pitch parameter to the frontend and synthesize that particular tone there. Avoid sending a separate HTTP request for every explored cell; that would add unnecessary latency during the race.

**Suggested C# audio structure:**

```text
NavX.Infrastructure/
└── Audio/
    ├── ISoundEffectGenerator.cs
    ├── NAudioSoundEffectGenerator.cs
    ├── SoundEffectOptions.cs
    └── GeneratedAudio/
        ├── bfs/
        ├── dfs/
        ├── greedy/
        ├── astar/
        └── events/
```

**Integration rules:**

- Keep NAudio-specific code in Infrastructure; do not reference NAudio from Domain or Application.
- Define the audio-generation interface in Application if the use cases need to request generated audio.
- Generate reusable audio assets in advance wherever possible.
- Use the Web Audio API in React for playback, volume control, stereo positioning, and synchronization with the race animation.
- Add a visible Mute/Unmute control and a way to preview the audio legend.
- Respect browser autoplay restrictions: initialize or resume audio only after the user interacts with the page.
- Keep audio optional. The race must remain fully usable when sound is muted or unavailable.

**Audio acceptance criteria:**

- Each algorithm can be distinguished by its waveform and stereo position.
- Each listed map-editing and race event triggers the appropriate sound.
- The explored-cell tick changes pitch according to the heuristic value.
- The first arrival and the lowest-Cost winner produce different sounds.
- Mute/Unmute works throughout the application.
- Audio playback does not block or slow down the race animation.

---

## 15. Testing

| Layer | Tool | What to Test |
|---|---|---|
| Domain | xUnit + Shouldly | `Grid` invariants, `WinnerPolicy`, `Race.Create` |
| Application | xUnit + NSubstitute | Handlers with fakes, Validators, `AssertConfigurationIsValid` |
| Infrastructure | xUnit | Repositories using SQLite in-memory and `PythonRaceEngine` with a real engine |
| API | `WebApplicationFactory` | Complete endpoints using a fake `IRaceEngine` |
| Architecture | NetArchTest | Domain has no dependencies, Application does not depend on Infrastructure, Controllers contain no logic |
| Python | pytest | Each algorithm: valid paths, no-path cases, `A* cost ≤ the others` |
| Frontend | Vitest | `RaceAnimator`, use cases with fake gateways, core Components |
| Audio | xUnit | Waveform generation, WAV output, sound mapping, and generated audio metadata |

**Contract tests:** A shared sample JSON file is tested by both Python and C#.

---

## 16. Clean Code Standards

- Enable `Nullable` and `TreatWarningsAsErrors` in all projects.
- Use a unified `.editorconfig` + analyzers (`SonarAnalyzer.CSharp` or `Roslynator`).
- Use `records` for DTOs and Commands, `sealed` for non-inheritable classes, and file-scoped namespaces.
- **One class per file**, with descriptive names (`RunRaceCommandHandler`, not `Manager`).
- Include a `CancellationToken` in every asynchronous operation.
- Prohibited: static state, `Thread.Sleep`, unjustified `catch (Exception)`, and magic numbers (put them in constants).
- Keep handlers small and use structured logging with `ILogger` (no `Console.WriteLine`).
- Use Conventional Commits. Every PR should include a checklist (tests, documentation, Swagger).
- Frontend: ESLint + Prettier, `strict` TypeScript, and no `any`.
- Python: `ruff` + `mypy`.

---

## 17. Demo

1. Open **Swagger** and test `POST /api/races` using a ready-made map (demonstrate Validation and error responses).
2. Open the UI, draw a map, and click **Start Race**.
3. Run the same map again and demonstrate that the response is faster because of caching.
4. Display the Stats (the number of wins for each algorithm).
5. Demonstrate the **Architecture tests** failing when a dependency rule is violated.
6. Enable the audio and demonstrate the distinctive sound identities, event effects, arrival sound, and winner fanfare. Then demonstrate Mute.

---

## 18. Risks

| Risk | Mitigation |
|---|---|
| Unnecessary complexity | Every abstraction must have a purpose; start simple and expand only when needed |
| Running Python on another machine | Configure `PythonEngineOptions.Executable` (`python` or `python3`) and validate it at startup |
| Slow process startup | Use caching and keep maps smaller than 50×50 |
| Contract changes between C# and Python | Use `contractVersion` and shared contract tests |
| MediatR and AutoMapper licensing | See Section 2; isolate them behind abstractions |
| Internet connection unavailable during the presentation | Run everything locally and prepare a backup video |
| No audio from the presentation device | Keep a visible Mute control and test the sound before the demo |
