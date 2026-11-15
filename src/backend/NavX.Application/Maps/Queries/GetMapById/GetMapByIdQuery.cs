using MediatR;
using NavX.Application.Abstractions;
using NavX.Application.Dtos;

namespace NavX.Application.Maps.Queries.GetMapById;

public record GetMapByIdQuery(Guid Id) : IRequest<MapDto?>;

public sealed class GetMapByIdQueryHandler : IRequestHandler<GetMapByIdQuery, MapDto?>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetMapByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<MapDto?> Handle(GetMapByIdQuery request, CancellationToken cancellationToken)
    {
        var map = await _unitOfWork.Maps.GetByIdAsync(request.Id, cancellationToken);
        if (map is null) return null;

        return new MapDto(
            map.Id,
            map.Name,
            map.Grid.ToJaggedArray(),
            map.DefaultStart.HasValue ? new[] { map.DefaultStart.Value.Row, map.DefaultStart.Value.Col } : null,
            map.DefaultGoal.HasValue ? new[] { map.DefaultGoal.Value.Row, map.DefaultGoal.Value.Col } : null,
            map.CreatedAtUtc);
    }
}
