namespace NavX.Domain.Enums;

/// <summary>
/// The search algorithms supported in NavX Arena.
/// </summary>
public enum AlgorithmType
{
    BFS = 1,
    DFS = 2,
    Greedy = 3,
    AStar = 4
}

/// <summary>
/// Extension helpers that convert AlgorithmType to the name the frontend expects.
/// Frontend ALGORITHMS record uses 'A*' — NOT 'AStar' (which is what .ToString() returns).
/// </summary>
public static class AlgorithmTypeExtensions
{
    /// <summary>Returns the frontend display name for the algorithm.</summary>
    public static string ToFrontendName(this AlgorithmType algorithm) =>
        algorithm == AlgorithmType.AStar ? "A*" : algorithm.ToString();
}
