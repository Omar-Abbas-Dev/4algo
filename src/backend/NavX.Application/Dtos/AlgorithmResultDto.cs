namespace NavX.Application.Dtos;

public record AlgorithmResultDto(
    string Algorithm,
    int? Cost,
    IReadOnlyList<int[]>? Path,
    IReadOnlyList<int[]>? Explored,
    int ExploredCount,
    double TimeMs);
