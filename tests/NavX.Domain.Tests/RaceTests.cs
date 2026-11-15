using NavX.Domain.Entities;
using NavX.Domain.Enums;
using NavX.Domain.Exceptions;
using NavX.Domain.ValueObjects;
using NavX.Infrastructure.Services;
using Shouldly;
using Xunit;

namespace NavX.Domain.Tests;

public class RaceTests
{
    private readonly Grid _grid = new(new[]
    {
        new[] { 1, 1, 1 },
        new[] { 1, -1, 1 },
        new[] { 1, 5, 1 }
    });

    private readonly WinnerPolicyService _policy = new();

    [Fact]
    public void Race_Create_ValidInputs_ShouldSucceedAndPickWinner()
    {
        var start = new Position(0, 0);
        var goal = new Position(2, 2);
        var results = new[]
        {
            AlgorithmResult.Create(Guid.Empty, AlgorithmType.BFS,   5, new[] { start, goal }, 8, 1.0),
            AlgorithmResult.Create(Guid.Empty, AlgorithmType.AStar, 4, new[] { start, goal }, 6, 1.2),
        };

        var race = Race.Create(_grid, start, goal, results, _policy);

        race.Id.ShouldNotBe(Guid.Empty);
        race.Winner.ShouldBe(AlgorithmType.AStar);
        race.Results.Count.ShouldBe(2);
    }

    [Fact]
    public void Race_Create_WhenStartEqualsGoal_ShouldThrowDomainException()
    {
        var pos = new Position(0, 0);
        Should.Throw<DomainException>(() => Race.Create(_grid, pos, pos, Array.Empty<AlgorithmResult>(), _policy));
    }

    [Fact]
    public void Race_Create_WhenStartIsBlocked_ShouldThrowDomainException()
    {
        var start = new Position(1, 1); // -1 in grid
        var goal = new Position(2, 2);
        Should.Throw<DomainException>(() => Race.Create(_grid, start, goal, Array.Empty<AlgorithmResult>(), _policy));
    }
}
