using NavX.Domain.Common;
using NavX.Domain.Exceptions;
using NavX.Domain.ValueObjects;

namespace NavX.Domain.Entities;

/// <summary>
/// Aggregate root representing a saved map preset in the system.
/// </summary>
public sealed class SavedMap : Entity<Guid>, IAggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public Grid Grid { get; private set; } = null!;
    public Position? DefaultStart { get; private set; }
    public Position? DefaultGoal { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    // Parameterless constructor for EF Core
    private SavedMap() { }

    private SavedMap(
        Guid id,
        string name,
        Grid grid,
        Position? defaultStart,
        Position? defaultGoal,
        DateTime createdAtUtc) : base(id)
    {
        Name = name;
        Grid = grid;
        DefaultStart = defaultStart;
        DefaultGoal = defaultGoal;
        CreatedAtUtc = createdAtUtc;
    }

    public static SavedMap Create(
        string name,
        Grid grid,
        Position? defaultStart = null,
        Position? defaultGoal = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Map name cannot be empty.");

        if (grid is null)
            throw new DomainException("Map grid cannot be null.");

        if (defaultStart.HasValue && !grid.Contains(defaultStart.Value))
            throw new DomainException($"Default start {defaultStart.Value} is outside grid bounds.");

        if (defaultGoal.HasValue && !grid.Contains(defaultGoal.Value))
            throw new DomainException($"Default goal {defaultGoal.Value} is outside grid bounds.");

        if (defaultStart.HasValue && defaultGoal.HasValue && defaultStart.Value == defaultGoal.Value)
            throw new DomainException("Default start and goal cannot be identical.");

        return new SavedMap(
            Guid.NewGuid(),
            name.Trim(),
            grid,
            defaultStart,
            defaultGoal,
            DateTime.UtcNow);
    }
}
