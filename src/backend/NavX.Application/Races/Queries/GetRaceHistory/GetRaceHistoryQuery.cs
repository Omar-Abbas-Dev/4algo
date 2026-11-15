using MediatR;
using NavX.Application.Abstractions;
using NavX.Application.Common;
using NavX.Application.Dtos;
using NavX.Domain.Enums;

namespace NavX.Application.Races.Queries.GetRaceHistory;

public record GetRaceHistoryQuery(int Page = 1, int PageSize = 10) : IRequest<PagedResult<RaceResultDto>>, ICacheableQuery
{
    public string CacheKey => $"history:{Page}:{PageSize}";
    public TimeSpan? Duration => TimeSpan.FromSeconds(30);
}

public sealed class GetRaceHistoryQueryHandler : IRequestHandler<GetRaceHistoryQuery, PagedResult<RaceResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetRaceHistoryQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<RaceResultDto>> Handle(GetRaceHistoryQuery request, CancellationToken cancellationToken)
    {
        var pagedRaces = await _unitOfWork.Races.GetHistoryAsync(request.Page, request.PageSize, cancellationToken);

        var dtos = pagedRaces.Items.Select(race =>
        {
            var resultDtos = race.Results.Select(r => new AlgorithmResultDto(
                r.Algorithm.ToFrontendName(),
                r.Cost,
                r.Path.Select(p => new[] { p.Row, p.Col }).ToArray(),
                null,
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
        }).ToList();

        return new PagedResult<RaceResultDto>(dtos, pagedRaces.Page, pagedRaces.PageSize, pagedRaces.TotalCount);
    }
}
