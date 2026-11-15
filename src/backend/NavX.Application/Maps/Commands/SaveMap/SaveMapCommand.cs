using FluentValidation;
using MediatR;
using NavX.Application.Abstractions;
using NavX.Application.Common;
using NavX.Application.Dtos;
using NavX.Domain.Entities;
using NavX.Domain.ValueObjects;

namespace NavX.Application.Maps.Commands.SaveMap;

public record SaveMapCommand(
    string Name,
    int[][] Grid,
    int[]? DefaultStart,
    int[]? DefaultGoal) : IRequest<MapDto>, ICacheInvalidatingCommand
{
    public IReadOnlyList<string> PrefixesToEvict => new[] { "maps:" };
}

public sealed class SaveMapCommandValidator : AbstractValidator<SaveMapCommand>
{
    public SaveMapCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Map name is required.")
            .MaximumLength(100).WithMessage("Map name must not exceed 100 characters.");

        RuleFor(x => x.Grid)
            .NotNull().WithMessage("Grid must not be null.")
            .NotEmpty().WithMessage("Grid must not be empty.")
            .Must(g => g.Length >= 2 && g.Length <= 50)
            .WithMessage("Grid row count must be between 2 and 50.")
            .Must(g => g[0] is not null && g[0].Length >= 2 && g[0].Length <= 50)
            .WithMessage("Grid column count must be between 2 and 50.");
    }
}

public sealed class SaveMapCommandHandler : IRequestHandler<SaveMapCommand, MapDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public SaveMapCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<MapDto> Handle(SaveMapCommand request, CancellationToken cancellationToken)
    {
        var domainGrid = new Grid(request.Grid);
        Position? start = request.DefaultStart != null ? new Position(request.DefaultStart[0], request.DefaultStart[1]) : null;
        Position? goal = request.DefaultGoal != null ? new Position(request.DefaultGoal[0], request.DefaultGoal[1]) : null;

        var map = SavedMap.Create(request.Name, domainGrid, start, goal);

        await _unitOfWork.Maps.AddAsync(map, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new MapDto(
            map.Id,
            map.Name,
            domainGrid.ToJaggedArray(),
            start.HasValue ? new[] { start.Value.Row, start.Value.Col } : null,
            goal.HasValue ? new[] { goal.Value.Row, goal.Value.Col } : null,
            map.CreatedAtUtc);
    }
}
