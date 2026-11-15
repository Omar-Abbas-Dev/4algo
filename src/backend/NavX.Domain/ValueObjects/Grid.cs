using NavX.Domain.Common;
using NavX.Domain.Enums;
using NavX.Domain.Exceptions;

namespace NavX.Domain.ValueObjects;

/// <summary>
/// Value Object representing a validated rectangular race grid.
/// </summary>
public sealed class Grid : ValueObject
{
    public const int MinDimension = 2;
    public const int MaxDimension = 50;

    private readonly int[][] _cells;

    public int Rows => _cells.Length;
    public int Cols => _cells[0].Length;

    public IReadOnlyList<IReadOnlyList<int>> Cells => _cells;

    public Grid(int[][] cells)
    {
        if (cells is null || cells.Length == 0 || cells[0] is null || cells[0].Length == 0)
            throw new InvalidGridException("Grid matrix cannot be null or empty.");

        int rows = cells.Length;
        int cols = cells[0].Length;

        if (rows < MinDimension || rows > MaxDimension || cols < MinDimension || cols > MaxDimension)
            throw new InvalidGridException($"Grid dimensions ({rows}x{cols}) must be between {MinDimension} and {MaxDimension}.");

        _cells = new int[rows][];
        for (int r = 0; r < rows; r++)
        {
            if (cells[r] is null || cells[r].Length != cols)
                throw new InvalidGridException($"Grid row {r} must have length {cols} to be rectangular.");

            _cells[r] = new int[cols];
            for (int c = 0; c < cols; c++)
            {
                int val = cells[r][c];
                if (val != (int)CellType.Open && val != (int)CellType.Traffic && val != (int)CellType.Blocked)
                    throw new InvalidGridException($"Invalid cell value at ({r}, {c}): {val}. Allowed: 1, 5, -1.");

                _cells[r][c] = val;
            }
        }
    }

    public bool Contains(Position position)
    {
        return position.Row >= 0 && position.Row < Rows &&
               position.Col >= 0 && position.Col < Cols;
    }

    public bool IsTraversable(Position position)
    {
        return Contains(position) && _cells[position.Row][position.Col] != (int)CellType.Blocked;
    }

    public int CostAt(Position position)
    {
        if (!Contains(position))
            throw new InvalidGridException($"Position {position} is outside grid bounds.");

        int val = _cells[position.Row][position.Col];
        if (val == (int)CellType.Blocked)
            throw new InvalidGridException($"Position {position} is blocked and cannot be traversed.");

        return val;
    }

    public int[][] ToJaggedArray()
    {
        var copy = new int[Rows][];
        for (int r = 0; r < Rows; r++)
        {
            copy[r] = (int[])_cells[r].Clone();
        }
        return copy;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Rows;
        yield return Cols;
        for (int r = 0; r < Rows; r++)
        {
            for (int c = 0; c < Cols; c++)
            {
                yield return _cells[r][c];
            }
        }
    }
}
