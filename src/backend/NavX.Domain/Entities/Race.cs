using NavX.Domain.Common;
using NavX.Domain.Enums;
using NavX.Domain.Exceptions;
using NavX.Domain.Services;
using NavX.Domain.ValueObjects;

namespace NavX.Domain.Entities;

/// <summary>
/// Aggregate root representing an executed race between search algorithms on a grid.
/// </summary>
public sealed class Race : Entity<Guid>, IAggregateRoot
{
    private readonly List<AlgorithmResult> _results = new();

    public DateTime CreatedAtUtc { get; private set; }
    public Grid Grid { get; private set; } = null!;
    public Position Start { get; private set; }
    public Position Goal { get; private set; }
    public AlgorithmType? Winner { get; private set; }

    public IReadOnlyList<AlgorithmResult> Results => _results.AsReadOnly();

    // Parameterless constructor for EF Core
    private Race() { }

    private Race(
        Guid id,
        DateTime createdAtUtc,
        Grid grid,
        Position start,
        Position goal,
        IEnumerable<AlgorithmResult> results,
        IWinnerPolicy winnerPolicy) : base(id)
    {
        CreatedAtUtc = createdAtUtc;
        Grid = grid;
        Start = start;
        Goal = goal;

        foreach (var res in results)
        {
            _results.Add(res);
        }

        Winner = winnerPolicy.DetermineWinner(_results);
    }

    /// <summary>
    /// Factory method enforcing domain invariants and automatically determining the winner.
    /// </summary>
    public static Race Create(
        Grid grid,
        Position start,
        Position goal,
        IEnumerable<AlgorithmResult> results,
        IWinnerPolicy winnerPolicy)
    {
        if (grid is null)
            throw new DomainException("Grid cannot be null.");

        if (!grid.Contains(start))
            throw new DomainException($"Start position {start} is outside the grid bounds.");

        if (!grid.Contains(goal))
            throw new DomainException($"Goal position {goal} is outside the grid bounds.");

        if (start == goal)
            throw new DomainException("Start and Goal positions cannot be identical.");

        if (!grid.IsTraversable(start))
            throw new DomainException($"Start position {start} cannot be a blocked cell.");

        if (!grid.IsTraversable(goal))
            throw new DomainException($"Goal position {goal} cannot be a blocked cell.");

        var raceId = Guid.NewGuid();
        var domainResults = results?.ToList() ?? throw new DomainException("Race results cannot be null.");

        return new Race(
            raceId,
            DateTime.UtcNow,
            grid,
            start,
            goal,
            domainResults,
            winnerPolicy);
    }
}
