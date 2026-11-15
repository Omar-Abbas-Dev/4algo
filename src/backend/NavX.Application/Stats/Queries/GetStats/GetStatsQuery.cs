using MediatR;
using NavX.Application.Abstractions;
using NavX.Application.Common;
using NavX.Application.Dtos;
using NavX.Domain.Enums;

namespace NavX.Application.Stats.Queries.GetStats;

public record GetStatsQuery : IRequest<StatsDto>, ICacheableQuery
{
    public string CacheKey => "stats";
    public TimeSpan? Duration => TimeSpan.FromSeconds(30);
}

public sealed class GetStatsQueryHandler : IRequestHandler<GetStatsQuery, StatsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetStatsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StatsDto> Handle(GetStatsQuery request, CancellationToken cancellationToken)
    {
        var totalRaces = await _unitOfWork.Races.GetTotalCountAsync(cancellationToken);
        var winCounts = await _unitOfWork.Races.GetWinCountsAsync(cancellationToken);

        var wins = new Dictionary<string, int>
        {
            ["BFS"] = winCounts.GetValueOrDefault(AlgorithmType.BFS, 0),
            ["DFS"] = winCounts.GetValueOrDefault(AlgorithmType.DFS, 0),
            ["Greedy"] = winCounts.GetValueOrDefault(AlgorithmType.Greedy, 0),
            ["A*"] = winCounts.GetValueOrDefault(AlgorithmType.AStar, 0)
        };

        var winPercentages = new Dictionary<string, double>();
        foreach (var (algo, count) in wins)
        {
            winPercentages[algo] = totalRaces > 0 ? Math.Round((double)count / totalRaces * 100.0, 1) : 0.0;
        }

        return new StatsDto(totalRaces, wins, winPercentages);
    }
}
