namespace NavX.Application.Common;

/// <summary>
/// Interface indicating a query whose result can be cached by CachingBehavior.
/// </summary>
public interface ICacheableQuery
{
    string CacheKey { get; }
    TimeSpan? Duration { get; }
}
