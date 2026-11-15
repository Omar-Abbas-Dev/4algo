using NavX.Domain.Entities;
using NavX.Domain.Enums;
using NavX.Domain.ValueObjects;
using NavX.Infrastructure.Services;
using Shouldly;
using Xunit;

namespace NavX.Domain.Tests;

public class WinnerPolicyTests
{
    private readonly WinnerPolicyService _policy = new();

    [Fact]
    public void DetermineWinner_LowestCost_ShouldWin()
    {
        var raceId = Guid.NewGuid();
        var results = new List<AlgorithmResult>
        {
            AlgorithmResult.Create(raceId, AlgorithmType.BFS,    12, new[] { new Position(0,0) }, 20, 1.5),
            AlgorithmResult.Create(raceId, AlgorithmType.AStar,   8, new[] { new Position(0,0) }, 15, 2.0),
            AlgorithmResult.Create(raceId, AlgorithmType.Greedy, 10, new[] { new Position(0,0) }, 10, 0.8),
            AlgorithmResult.Create(raceId, AlgorithmType.DFS,    25, new[] { new Position(0,0) }, 40, 3.2),
        };

        var winner = _policy.DetermineWinner(results);

        // Range-normalised composite: 0.6*(cost-min)/(max-min) + 0.4*(time-min)/(max-min)
        // costs: min=8, max=25, range=17  |  times: min=0.8, max=3.2, range=2.4
        // AStar:  0.6*(0/17) + 0.4*(1.2/2.4) = 0.000 + 0.200 = 0.200
        // Greedy: 0.6*(2/17) + 0.4*(0.0/2.4) = 0.071 + 0.000 = 0.071  ← winner
        // BFS:    0.6*(4/17) + 0.4*(0.7/2.4) = 0.141 + 0.117 = 0.258
        // DFS:    0.6*(17/17)+ 0.4*(2.4/2.4) = 0.600 + 0.400 = 1.000
        winner.ShouldBe(AlgorithmType.Greedy);
    }

    [Fact]
    public void DetermineWinner_WhenCostTied_FastestTimeShouldWin()
    {
        // Both have cost=10; AStar has lower timeMs so should win on composite score
        var raceId = Guid.NewGuid();
        var results = new List<AlgorithmResult>
        {
            AlgorithmResult.Create(raceId, AlgorithmType.BFS,   10, new[] { new Position(0,0) }, 25, 2.0),
            AlgorithmResult.Create(raceId, AlgorithmType.AStar, 10, new[] { new Position(0,0) }, 14, 1.0),
        };

        var winner = _policy.DetermineWinner(results);

        // costRange=0 → falls back to 1 → both cost terms = 0
        // timeRange=1.0 → BFS=(2.0-1.0)/1.0=1.0, AStar=(1.0-1.0)/1.0=0.0
        // AStar score=0.0 wins
        winner.ShouldBe(AlgorithmType.AStar);
    }

    [Fact]
    public void DetermineWinner_WhenAllNullCost_ShouldReturnNull()
    {
        var raceId = Guid.NewGuid();
        var results = new List<AlgorithmResult>
        {
            AlgorithmResult.Create(raceId, AlgorithmType.BFS,   null, Array.Empty<Position>(), 10, 1.0),
            AlgorithmResult.Create(raceId, AlgorithmType.AStar, null, Array.Empty<Position>(), 10, 1.0),
        };

        var winner = _policy.DetermineWinner(results);

        winner.ShouldBeNull();
    }

    [Fact]
    public void DetermineWinner_AStarLowestCost_ShouldBeatFasterAlgorithm()
    {
        // A* has optimal cost even though it's slower; cost advantage should win
        var raceId = Guid.NewGuid();
        var results = new List<AlgorithmResult>
        {
            AlgorithmResult.Create(raceId, AlgorithmType.BFS,    40, new[] { new Position(0,0) }, 50, 0.15),
            AlgorithmResult.Create(raceId, AlgorithmType.DFS,    40, new[] { new Position(0,0) }, 15, 0.06),
            AlgorithmResult.Create(raceId, AlgorithmType.Greedy, 40, new[] { new Position(0,0) }, 15, 0.07),
            AlgorithmResult.Create(raceId, AlgorithmType.AStar,  16, new[] { new Position(0,0) }, 18, 0.08),
        };

        var winner = _policy.DetermineWinner(results);

        // costs: min=16, max=40, range=24  |  times: min=0.06, max=0.15, range=0.09
        // A*:     0.6*(0/24)  + 0.4*(0.02/0.09) = 0.000 + 0.089 = 0.089  ← winner
        // DFS:    0.6*(24/24) + 0.4*(0.00/0.09) = 0.600 + 0.000 = 0.600
        // Greedy: 0.6*(24/24) + 0.4*(0.01/0.09) = 0.600 + 0.044 = 0.644
        // BFS:    0.6*(24/24) + 0.4*(0.09/0.09) = 0.600 + 0.400 = 1.000
        winner.ShouldBe(AlgorithmType.AStar);
    }
}
