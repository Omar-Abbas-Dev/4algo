using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using NavX.Application.Abstractions;

namespace NavX.Infrastructure.Caching;

/// <summary>
/// In-memory cache service implementation with thread-safe prefix invalidation support.
/// </summary>
public sealed class MemoryCacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly ConcurrentDictionary<string, bool> _keys = new();

    public MemoryCacheService(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        if (_memoryCache.TryGetValue(key, out T? value))
        {
            return Task.FromResult(value);
        }

        return Task.FromResult(default(T));
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? duration = null, CancellationToken ct = default)
    {
        var options = new MemoryCacheEntryOptions();
        if (duration.HasValue)
        {
            options.SetAbsoluteExpiration(duration.Value);
        }
        else
        {
            options.SetSlidingExpiration(TimeSpan.FromMinutes(10));
        }

        options.RegisterPostEvictionCallback((k, _, _, _) =>
        {
            if (k is string keyStr)
            {
                _keys.TryRemove(keyStr, out _);
            }
        });

        _memoryCache.Set(key, value, options);
        _keys.TryAdd(key, true);

        return Task.CompletedTask;
    }

    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        TimeSpan? duration = null,
        CancellationToken ct = default)
    {
        var existing = await GetAsync<T>(key, ct);
        if (existing is not null)
        {
            return existing;
        }

        var created = await factory(ct);
        await SetAsync(key, created, duration, ct);
        return created;
    }

    public Task RemoveAsync(string key, CancellationToken ct = default)
    {
        _memoryCache.Remove(key);
        _keys.TryRemove(key, out _);
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        var matchingKeys = _keys.Keys.Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).ToList();

        foreach (var key in matchingKeys)
        {
            _memoryCache.Remove(key);
            _keys.TryRemove(key, out _);
        }

        return Task.CompletedTask;
    }
}
