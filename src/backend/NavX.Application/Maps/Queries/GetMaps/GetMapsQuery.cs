using MediatR;
using NavX.Application.Abstractions;
using NavX.Application.Common;
using NavX.Application.Dtos;

namespace NavX.Application.Maps.Queries.GetMaps;

public record GetMapsQuery : IRequest<IReadOnlyList<MapDto>>, ICacheableQuery
{
    public string CacheKey => "maps:list";
    public TimeSpan? Duration => TimeSpan.FromMinutes(5);
}

public sealed class GetMapsQueryHandler : IRequestHandler<GetMapsQuery, IReadOnlyList<MapDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetMapsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<MapDto>> Handle(GetMapsQuery request, CancellationToken cancellationToken)
    {
        var maps = await _unitOfWork.Maps.GetAllAsync(cancellationToken);

        return maps.Select(m => new MapDto(
            m.Id,
            m.Name,
            m.Grid.ToJaggedArray(),
            m.DefaultStart.HasValue ? new[] { m.DefaultStart.Value.Row, m.DefaultStart.Value.Col } : null,
            m.DefaultGoal.HasValue ? new[] { m.DefaultGoal.Value.Row, m.DefaultGoal.Value.Col } : null,
            m.CreatedAtUtc)).ToList();
    }
}
