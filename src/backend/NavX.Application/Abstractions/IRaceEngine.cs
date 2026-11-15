using NavX.Domain.Enums;
using NavX.Domain.ValueObjects;

namespace NavX.Application.Abstractions;

public record EngineAlgorithmResult(
    AlgorithmType Algorithm,
    IReadOnlyList<Position>? Path,
    IReadOnlyList<Position> Explored,
    int? Cost,
    double TimeMs);

public record EngineExecutionResult(
    IReadOnlyList<EngineAlgorithmResult> Results,
    bool FromCache);

/// <summary>
/// Abstraction for executing search algorithms via the Python engine or a cached decorator.
/// </summary>
public interface IRaceEngine
{
    Task<EngineExecutionResult> RunAsync(
        int[][] grid,
        Position start,
        Position goal,
        IReadOnlyList<string>? algorithms = null,
        CancellationToken ct = default);
}
