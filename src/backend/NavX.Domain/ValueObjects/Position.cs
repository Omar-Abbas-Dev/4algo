namespace NavX.Domain.ValueObjects;

/// <summary>
/// A 2D coordinate on the race grid map.
/// </summary>
public readonly record struct Position(int Row, int Col)
{
    public int ManhattanDistance(Position other) =>
        Math.Abs(Row - other.Row) + Math.Abs(Col - other.Col);

    public override string ToString() => $"({Row}, {Col})";
}
