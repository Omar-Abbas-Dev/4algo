namespace NavX.Application.Common;

/// <summary>
/// Interface indicating a command whose successful execution evicts cache entries by prefixes.
/// </summary>
public interface ICacheInvalidatingCommand
{
    IReadOnlyList<string> PrefixesToEvict { get; }
}
