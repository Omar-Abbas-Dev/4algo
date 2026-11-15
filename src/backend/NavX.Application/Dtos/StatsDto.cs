namespace NavX.Application.Dtos;

public record StatsDto(
    int TotalRaces,
    IReadOnlyDictionary<string, int> Wins,
    IReadOnlyDictionary<string, double> WinPercentages);
