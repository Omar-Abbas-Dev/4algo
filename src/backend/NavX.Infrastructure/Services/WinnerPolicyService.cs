using NavX.Domain.Entities;
using NavX.Domain.Enums;
using NavX.Domain.Services;

namespace NavX.Infrastructure.Services;

/// <summary>
/// Infrastructure implementation of <see cref="IWinnerPolicy"/>.
///
/// Composite score formula (lower = better):
///   Score = 0.6 × (cost / maxCost) + 0.4 × (timeMs / maxTime)
///
/// Both metrics are normalised to [0, 1].
/// Fuel cost = 60% weight (path quality), execution time = 40% weight (search speed).
///
/// When all algorithms share the same cost, the formula degenerates to a pure
/// time comparison. To preserve algorithm fairness in that case, the cost
/// term uses RANGE normalisation: (cost − minCost) / (maxCost − minCost).
/// This ensures cost variation is fully captured before time is applied.
///
/// Algorithms that found no valid path are excluded.
/// </summary>
public sealed class WinnerPolicyService : IWinnerPolicy
{
    public const double CostWeight = 0.6;
    public const double TimeWeight = 0.4;

    public AlgorithmType? DetermineWinner(IEnumerable<AlgorithmResult> results)
    {
        var valid = results.Where(r => r.Cost.HasValue).ToList();
        if (valid.Count == 0) return null;

        double maxCost = valid.Max(r => (double)r.Cost!.Value);
        double minCost = valid.Min(r => (double)r.Cost!.Value);
        double maxTime = valid.Max(r => r.TimeMs);
        double minTime = valid.Min(r => r.TimeMs);

        // Range normalisation: spreads out the [0,1] scale so small cost
        // differences are still captured, not collapsed by max-only division.
        double costRange = maxCost - minCost > 0 ? maxCost - minCost : 1;
        double timeRange = maxTime - minTime > 0 ? maxTime - minTime : 1;

        var ranked = valid
            .Select(r => new
            {
                r.Algorithm,
                Score = CostWeight  * ((r.Cost!.Value   - minCost) / costRange)
                      + TimeWeight  * ((r.TimeMs         - minTime) / timeRange),
            })
            .OrderBy(x => x.Score)
            .ThenBy(x => GetAlgorithmPriority(x.Algorithm)) // stable tiebreak
            .ToList();

        return ranked[0].Algorithm;
    }

    private static int GetAlgorithmPriority(AlgorithmType algorithm) => algorithm switch
    {
        AlgorithmType.AStar   => 1,
        AlgorithmType.Greedy  => 2,
        AlgorithmType.BFS     => 3,
        AlgorithmType.DFS     => 4,
        _                     => 5,
    };
}
