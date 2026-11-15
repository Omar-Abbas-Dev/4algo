using NSubstitute;
using NavX.Application.Abstractions;
using NavX.Application.Races.Commands.RunRace;
using NavX.Domain.Entities;
using NavX.Domain.Enums;
using NavX.Domain.Services;
using NavX.Domain.ValueObjects;
using Shouldly;
using Xunit;

namespace NavX.Application.Tests;

public class RunRaceCommandHandlerTests
{
    private readonly IRaceEngine _engine = Substitute.For<IRaceEngine>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IWinnerPolicy _winnerPolicy = Substitute.For<IWinnerPolicy>();

    [Fact]
    public async Task Handle_WhenValidCommand_ShouldExecuteEngineSaveRaceAndReturnResult()
    {
        var command = new RunRaceCommand(
            Grid: new[]
            {
                new[] { 1, 1 },
                new[] { 1, 1 }
            },
            Start: new[] { 0, 0 },
            Goal: new[] { 1, 1 });

        var engineResult = new EngineExecutionResult(
            new[]
            {
                new EngineAlgorithmResult(
                    AlgorithmType.AStar,
                    new[] { new Position(0, 0), new Position(1, 1) },
                    new[] { new Position(0, 0), new Position(1, 1) },
                    2,
                    0.5),
                new EngineAlgorithmResult(
                    AlgorithmType.BFS,
                    new[] { new Position(0, 0), new Position(1, 1) },
                    new[] { new Position(0, 0), new Position(1, 1) },
                    2,
                    0.6)
            },
            FromCache: false);

        _engine.RunAsync(
                Arg.Any<int[][]>(),
                Arg.Any<Position>(),
                Arg.Any<Position>(),
                Arg.Any<IReadOnlyList<string>?>(),
                Arg.Any<CancellationToken>())
            .Returns(engineResult);

        // Policy returns AStar as winner
        _winnerPolicy.DetermineWinner(Arg.Any<IEnumerable<AlgorithmResult>>())
            .Returns(AlgorithmType.AStar);

        var handler = new RunRaceCommandHandler(_engine, _unitOfWork, _winnerPolicy);

        var result = await handler.Handle(command, CancellationToken.None);

        result.ShouldNotBeNull();
        result.Winner.ShouldBe("A*");
        result.Results.Count.ShouldBe(2);
        result.FromCache.ShouldBeFalse();

        await _unitOfWork.Races.Received(1).AddAsync(Arg.Any<Race>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
