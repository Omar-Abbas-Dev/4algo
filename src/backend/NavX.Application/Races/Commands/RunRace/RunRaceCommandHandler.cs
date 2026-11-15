using MediatR;
using NavX.Application.Abstractions;
using NavX.Application.Dtos;
using NavX.Domain.Entities;
using NavX.Domain.Enums;
using NavX.Domain.Services;
using NavX.Domain.ValueObjects;

namespace NavX.Application.Races.Commands.RunRace;

public sealed class RunRaceCommandHandler : IRequestHandler<RunRaceCommand, RaceResultDto>
{
    private readonly IRaceEngine _engine;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWinnerPolicy _winnerPolicy;

    public RunRaceCommandHandler(IRaceEngine engine, IUnitOfWork unitOfWork, IWinnerPolicy winnerPolicy)
    {
        _engine = engine;
        _unitOfWork = unitOfWork;
        _winnerPolicy = winnerPolicy;
    }

    public async Task<RaceResultDto> Handle(RunRaceCommand command, CancellationToken cancellationToken)
    {
        var startPos = new Position(command.Start[0], command.Start[1]);
        var goalPos = new Position(command.Goal[0], command.Goal[1]);
        var domainGrid = new Grid(command.Grid);

        // 1. Run algorithm engine (decorated with caching)
        var execution = await _engine.RunAsync(command.Grid, startPos, goalPos, command.Algorithms, cancellationToken);

        // 2. Build domain model entities and determine winner
        var domainResults = execution.Results.Select(r => AlgorithmResult.Create(
            Guid.Empty,
            r.Algorithm,
            r.Cost,
            r.Path ?? Array.Empty<Position>(),
            r.Explored.Count,
            r.TimeMs)).ToList();

        var race = Race.Create(domainGrid, startPos, goalPos, domainResults, _winnerPolicy);

        // 3. Persist race to database (results persisted without raw explored cells to save space)
        await _unitOfWork.Races.AddAsync(race, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 4. Map to DTO including explored cells for the frontend race animation
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
            domainGrid.ToJaggedArray(),
            new[] { startPos.Row, startPos.Col },
            new[] { goalPos.Row, goalPos.Col },
            race.Winner?.ToFrontendName(),
            resultDtos,
            execution.FromCache);
    }
}
