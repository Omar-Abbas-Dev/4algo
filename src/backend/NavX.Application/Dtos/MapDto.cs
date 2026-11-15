namespace NavX.Application.Dtos;

public record MapDto(
    Guid Id,
    string Name,
    int[][] Grid,
    int[]? DefaultStart,
    int[]? DefaultGoal,
    DateTime CreatedAtUtc);
