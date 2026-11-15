using NavX.Domain.Exceptions;
using NavX.Domain.ValueObjects;
using Shouldly;
using Xunit;

namespace NavX.Domain.Tests;

public class GridTests
{
    [Fact]
    public void Grid_WithValidCells_ShouldInitializeCorrectly()
    {
        int[][] cells = [
            [1, 5, 1],
            [1, -1, 1]
        ];

        var grid = new Grid(cells);

        grid.Rows.ShouldBe(2);
        grid.Cols.ShouldBe(3);
        grid.CostAt(new Position(0, 1)).ShouldBe(5);
        grid.IsTraversable(new Position(0, 0)).ShouldBeTrue();
        grid.IsTraversable(new Position(1, 1)).ShouldBeFalse();
    }

    [Fact]
    public void Grid_WhenNonRectangular_ShouldThrowInvalidGridException()
    {
        int[][] cells = [
            [1, 1, 1],
            [1, 1]
        ];

        Should.Throw<InvalidGridException>(() => new Grid(cells));
    }

    [Fact]
    public void Grid_WhenInvalidCellValue_ShouldThrowInvalidGridException()
    {
        int[][] cells = [
            [1, 99],
            [1, 1]
        ];

        Should.Throw<InvalidGridException>(() => new Grid(cells));
    }

    [Theory]
    [InlineData(1, 2)]
    [InlineData(2, 51)]
    public void Grid_WhenDimensionsOutOfBounds_ShouldThrowInvalidGridException(int rows, int cols)
    {
        var cells = new int[rows][];
        for (int r = 0; r < rows; r++)
        {
            cells[r] = new int[cols];
            Array.Fill(cells[r], 1);
        }

        Should.Throw<InvalidGridException>(() => new Grid(cells));
    }
}
