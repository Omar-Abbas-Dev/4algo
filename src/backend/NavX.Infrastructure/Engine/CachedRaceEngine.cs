using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using NavX.Application.Abstractions;
using NavX.Domain.ValueObjects;

namespace NavX.Infrastructure.Engine;

/// <summary>
/// Decorator around PythonRaceEngine providing caching for deterministic search algorithm outcomes.
/// The cache key includes the selected algorithms so different subsets get distinct entries.
/// </summary>
public sealed class CachedRaceEngine : IRaceEngine
{
    private readonly IRaceEngine _inner;
    private readonly ICacheService _cacheService;
    private readonly ILogger<CachedRaceEngine> _logger;
    private static readonly TimeSpan DefaultCacheDuration = TimeSpan.FromHours(1);

    public CachedRaceEngine(
        IRaceEngine inner,
        ICacheService cacheService,
        ILogger<CachedRaceEngine> logger)
    {
        _inner = inner;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<EngineExecutionResult> RunAsync(
        int[][] grid,
        Position start,
        Position goal,
        IReadOnlyList<string>? algorithms = null,
        CancellationToken ct = default)
    {
        string cacheKey = ComputeCacheKey(grid, start, goal, algorithms);

        var cached = await _cacheService.GetAsync<IReadOnlyList<EngineAlgorithmResult>>(cacheKey, ct);
        if (cached is not null)
        {
            _logger.LogInformation("Engine cache hit for key: {CacheKey}", cacheKey);
            return new EngineExecutionResult(cached, FromCache: true);
        }

        _logger.LogInformation("Engine cache miss for key: {CacheKey}. Executing Python engine...", cacheKey);
        var freshResult = await _inner.RunAsync(grid, start, goal, algorithms, ct);

        await _cacheService.SetAsync(cacheKey, freshResult.Results, DefaultCacheDuration, ct);

        return freshResult;
    }

    private static string ComputeCacheKey(int[][] grid, Position start, Position goal, IReadOnlyList<string>? algorithms)
    {
        var sb = new StringBuilder();
        sb.Append($"s:{start.Row},{start.Col};g:{goal.Row},{goal.Col};");

        // Include sorted algorithm list in key so subset selections get distinct cache entries
        if (algorithms is { Count: > 0 })
        {
            sb.Append("algos:");
            sb.Append(string.Join(",", algorithms.OrderBy(a => a)));
            sb.Append(';');
        }

        sb.Append("grid:");
        for (int r = 0; r < grid.Length; r++)
        {
            for (int c = 0; c < grid[r].Length; c++)
            {
                sb.Append(grid[r][c]).Append(',');
            }
            sb.Append(';');
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var hashBytes = SHA256.HashData(bytes);
        return $"engine:{Convert.ToHexString(hashBytes).ToLowerInvariant()}";
    }
}
