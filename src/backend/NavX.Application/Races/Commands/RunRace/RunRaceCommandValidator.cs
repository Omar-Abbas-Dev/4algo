using FluentValidation;

namespace NavX.Application.Races.Commands.RunRace;

public sealed class RunRaceCommandValidator : AbstractValidator<RunRaceCommand>
{
    public RunRaceCommandValidator()
    {
        RuleFor(x => x.Grid)
            .NotNull().WithMessage("Grid must not be null.")
            .NotEmpty().WithMessage("Grid must not be empty.")
            .Must(g => g.Length >= 2 && g.Length <= 50)
            .WithMessage("Grid row count must be between 2 and 50.")
            .Must(g => g[0] is not null && g[0].Length >= 2 && g[0].Length <= 50)
            .WithMessage("Grid column count must be between 2 and 50.")
            .Must(BeRectangular)
            .WithMessage("All rows in the grid must have identical length.")
            .Must(HaveValidCellValues)
            .WithMessage("All grid cells must be 1 (open), 5 (traffic), or -1 (blocked).");

        RuleFor(x => x.Start)
            .NotNull().WithMessage("Start coordinates must not be null.")
            .Must(s => s.Length == 2).WithMessage("Start must be a 2-element array [row, col].");

        RuleFor(x => x.Goal)
            .NotNull().WithMessage("Goal coordinates must not be null.")
            .Must(g => g.Length == 2).WithMessage("Goal must be a 2-element array [row, col].");

        RuleFor(x => x.Algorithms)
            .Must(algos => algos == null || (algos.Count >= 1 && algos.Count <= 4))
            .WithMessage("Algorithms list must contain between 1 and 4 entries.")
            .Must(algos => algos == null || algos.All(a => new[] { "BFS", "DFS", "Greedy", "A*" }.Contains(a)))
            .WithMessage("Each algorithm must be one of: BFS, DFS, Greedy, A*.");

        When(x => x.Grid != null && x.Grid.Length > 0 && x.Start != null && x.Start.Length == 2 && x.Goal != null && x.Goal.Length == 2, () =>
        {
            RuleFor(x => x)
                .Must(x => x.Start[0] != x.Goal[0] || x.Start[1] != x.Goal[1])
                .WithMessage("Start and Goal coordinates cannot be identical.")
                .Must(x => IsWithinBounds(x.Grid, x.Start[0], x.Start[1]))
                .WithMessage("Start position is outside the grid bounds.")
                .Must(x => IsWithinBounds(x.Grid, x.Goal[0], x.Goal[1]))
                .WithMessage("Goal position is outside the grid bounds.")
                .Must(x => !IsBlocked(x.Grid, x.Start[0], x.Start[1]))
                .WithMessage("Start position cannot be on a blocked road (-1).")
                .Must(x => !IsBlocked(x.Grid, x.Goal[0], x.Goal[1]))
                .WithMessage("Goal position cannot be on a blocked road (-1).");
        });
    }

    private static bool BeRectangular(int[][]? grid)
    {
        if (grid is null || grid.Length == 0 || grid[0] is null) return false;
        int expectedCols = grid[0].Length;
        return grid.All(row => row is not null && row.Length == expectedCols);
    }

    private static bool HaveValidCellValues(int[][]? grid)
    {
        if (grid is null) return false;
        return grid.All(row => row != null && row.All(cell => cell == 1 || cell == 5 || cell == -1));
    }

    private static bool IsWithinBounds(int[][] grid, int row, int col)
    {
        return row >= 0 && row < grid.Length && col >= 0 && col < grid[0].Length;
    }

    private static bool IsBlocked(int[][] grid, int row, int col)
    {
        return IsWithinBounds(grid, row, col) && grid[row][col] == -1;
    }
}
