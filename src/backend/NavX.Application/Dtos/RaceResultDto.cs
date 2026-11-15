namespace NavX.Application.Dtos;

public record RaceResultDto(
    Guid Id,
    DateTime CreatedAtUtc,
    int[][] Grid,
    int[] Start,
    int[] Goal,
    string? Winner,
    IReadOnlyList<AlgorithmResultDto> Results,
    bool FromCache);
