using System.Text.Json.Serialization;

namespace NavX.Infrastructure.Engine;

public record EngineRaceRequest(
    [property: JsonPropertyName("contractVersion")] int ContractVersion,
    [property: JsonPropertyName("grid")] int[][] Grid,
    [property: JsonPropertyName("start")] int[] Start,
    [property: JsonPropertyName("goal")] int[] Goal,
    [property: JsonPropertyName("algorithms")] IReadOnlyList<string>? Algorithms = null);

public record EngineAlgorithmResponse(
    [property: JsonPropertyName("algorithm")] string Algorithm,
    [property: JsonPropertyName("path")] IReadOnlyList<int[]>? Path,
    [property: JsonPropertyName("explored")] IReadOnlyList<int[]> Explored,
    [property: JsonPropertyName("cost")] int? Cost,
    [property: JsonPropertyName("timeMs")] double TimeMs);

public record EngineRaceResponse(
    [property: JsonPropertyName("contractVersion")] int ContractVersion,
    [property: JsonPropertyName("results")] IReadOnlyList<EngineAlgorithmResponse> Results);

public record EngineErrorResponse(
    [property: JsonPropertyName("error")] string? Error);
