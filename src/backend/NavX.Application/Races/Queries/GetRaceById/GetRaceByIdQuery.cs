using MediatR;
using NavX.Application.Abstractions;
using NavX.Application.Dtos;
using NavX.Domain.Enums;

namespace NavX.Application.Races.Queries.GetRaceById;

public record GetRaceByIdQuery(Guid Id) : IRequest<RaceResultDto?>;

public sealed class GetRaceByIdQueryHandler : IRequestHandler<GetRaceByIdQuery, RaceResultDto?>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetRaceByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<RaceResultDto?> Handle(GetRaceByIdQuery request, CancellationToken cancellationToken)
    {
        var race = await _unitOfWork.Races.GetByIdAsync(request.Id, cancellationToken);
        if (race is null) return null;

        var resultDtos = race.Results.Select(r => new AlgorithmResultDto(
            r.Algorithm.ToFrontendName(),
            r.Cost,
            r.Path.Select(p => new[] { p.Row, p.Col }).ToArray(),
            null, // Explored cells not persisted in DB
            r.ExploredCount,
            r.TimeMs)).ToList();

        return new RaceResultDto(
            race.Id,
            race.CreatedAtUtc,
            race.Grid.ToJaggedArray(),
            new[] { race.Start.Row, race.Start.Col },
            new[] { race.Goal.Row, race.Goal.Col },
            race.Winner?.ToFrontendName(),
            resultDtos,
            FromCache: false);
    }
}
