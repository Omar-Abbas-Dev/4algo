using NavX.Domain.Entities;
using NavX.Domain.Enums;

namespace NavX.Domain.Services;

/// <summary>
/// Determines the winner of a race based on algorithm results.
/// Implementation lives in NavX.Infrastructure (Clean Architecture:
/// concrete services with business-rule calculations belong in Infrastructure,
/// not in the pure domain model).
/// </summary>
public interface IWinnerPolicy
{
    AlgorithmType? DetermineWinner(IEnumerable<AlgorithmResult> results);
}
