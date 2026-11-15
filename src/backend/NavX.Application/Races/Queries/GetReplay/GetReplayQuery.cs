using MediatR;
using NavX.Application.Abstractions;
using NavX.Application.Common;
using NavX.Application.Dtos;
using NavX.Domain.Enums;

namespace NavX.Application.Races.Queries.GetReplay;

public record GetReplayQuery(Guid Id) : IRequest<RaceResultDto?>, ICacheableQuery
{
    public string CacheKey => $"replay:{Id}";
    public TimeSpan? Duration => TimeSpan.FromMinutes(10);
}

public sealed class GetReplayQueryHandler : IRequestHandler<GetReplayQuery, RaceResultDto?>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRaceEngine _engine;

    public GetReplayQueryHandler(IUnitOfWork unitOfWork, IRaceEngine engine)
    {
        _unitOfWork = unitOfWork;
        _engine = engine;
    }

    public async Task<RaceResultDto?> Handle(GetReplayQuery request, CancellationToken cancellationToken)
    {
        var race = await _unitOfWork.Races.GetByIdAsync(request.Id, cancellationToken);
        if (race is null) return null;

        // Re-execute algorithms to reproduce full explored cells deterministic stream
        var execution = await _engine.RunAsync(race.Grid.ToJaggedArray(), race.Start, race.Goal, null, cancellationToken);

        var resultDtos = execution.Results.Select(r => new AlgorithmResultDto(
            r.Algorithm.ToFrontendName(),
            r.Cost,
            r.Path?.Select(p => new[] { p.Row, p.Col }).ToArray(),
            r.Explored.Select(p => new[] { p.Row, p.Col }).ToArray(),
            r.Explored.Count,
            r.TimeMs)).ToList();

        return new RaceResultDto(
            race.Id,
            race.CreatedAtUtc,
            race.Grid.ToJaggedArray(),
            new[] { race.Start.Row, race.Start.Col },
            new[] { race.Goal.Row, race.Goal.Col },
            race.Winner?.ToFrontendName(),
            resultDtos,
            execution.FromCache);
    }
}
