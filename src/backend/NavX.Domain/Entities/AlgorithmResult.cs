using NavX.Domain.Common;
using NavX.Domain.Enums;
using NavX.Domain.ValueObjects;

namespace NavX.Domain.Entities;

/// <summary>
/// Domain entity capturing the race outcome of a single search algorithm.
/// </summary>
public sealed class AlgorithmResult : Entity<Guid>
{
    public Guid RaceId { get; private set; }
    public AlgorithmType Algorithm { get; private set; }
    public int? Cost { get; private set; }
    public IReadOnlyList<Position> Path { get; private set; }
    public int ExploredCount { get; private set; }
    public double TimeMs { get; private set; }

    // Parameterless constructor for EF Core
    private AlgorithmResult()
    {
        Path = Array.Empty<Position>();
    }

    public AlgorithmResult(
        Guid id,
        Guid raceId,
        AlgorithmType algorithm,
        int? cost,
        IReadOnlyList<Position> path,
        int exploredCount,
        double timeMs) : base(id)
    {
        RaceId = raceId;
        Algorithm = algorithm;
        Cost = cost;
        Path = path ?? Array.Empty<Position>();
        ExploredCount = exploredCount;
        TimeMs = timeMs;
    }

    public static AlgorithmResult Create(
        Guid raceId,
        AlgorithmType algorithm,
        int? cost,
        IReadOnlyList<Position> path,
        int exploredCount,
        double timeMs)
    {
        return new AlgorithmResult(
            Guid.NewGuid(),
            raceId,
            algorithm,
            cost,
            path,
            exploredCount,
            timeMs);
    }
}
