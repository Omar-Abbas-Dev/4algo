using MediatR;
using NavX.Application.Common;
using NavX.Application.Dtos;

namespace NavX.Application.Races.Commands.RunRace;

public record RunRaceCommand(
    int[][] Grid,
    int[] Start,
    int[] Goal,
    /// <summary>
    /// Optional list of algorithm names to include in the race.
    /// Null or empty means "run all four". Valid values: "BFS", "DFS", "Greedy", "A*".
    /// </summary>
    IReadOnlyList<string>? Algorithms = null) : IRequest<RaceResultDto>, ICacheInvalidatingCommand
{
    public IReadOnlyList<string> PrefixesToEvict => new[] { "stats", "history:" };
}
