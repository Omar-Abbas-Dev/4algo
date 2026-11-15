using NavX.Application.Races.Commands.RunRace;
using Shouldly;
using Xunit;

namespace NavX.Application.Tests;

public class RunRaceCommandValidatorTests
{
    private readonly RunRaceCommandValidator _validator = new();

    [Fact]
    public void Validator_WhenValidCommand_ShouldNotHaveErrors()
    {
        var command = new RunRaceCommand(
            Grid: new[]
            {
                new[] { 1, 1, 1 },
                new[] { 1, 5, 1 },
                new[] { 1, 1, 1 }
            },
            Start: new[] { 0, 0 },
            Goal: new[] { 2, 2 });

        var result = _validator.Validate(command);

        result.IsValid.ShouldBeTrue();
    }

    [Fact]
    public void Validator_WhenStartEqualsGoal_ShouldHaveValidationError()
    {
        var command = new RunRaceCommand(
            Grid: new[]
            {
                new[] { 1, 1 },
                new[] { 1, 1 }
            },
            Start: new[] { 0, 0 },
            Goal: new[] { 0, 0 });

        var result = _validator.Validate(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.ErrorMessage.Contains("identical"));
    }

    [Fact]
    public void Validator_WhenStartOutOfBounds_ShouldHaveValidationError()
    {
        var command = new RunRaceCommand(
            Grid: new[]
            {
                new[] { 1, 1 },
                new[] { 1, 1 }
            },
            Start: new[] { 5, 5 },
            Goal: new[] { 1, 1 });

        var result = _validator.Validate(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.ErrorMessage.Contains("bounds"));
    }

    [Fact]
    public void Validator_WhenStartIsBlocked_ShouldHaveValidationError()
    {
        var command = new RunRaceCommand(
            Grid: new[]
            {
                new[] { -1, 1 },
                new[] { 1, 1 }
            },
            Start: new[] { 0, 0 },
            Goal: new[] { 1, 1 });

        var result = _validator.Validate(command);

        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.ErrorMessage.Contains("blocked"));
    }
}
