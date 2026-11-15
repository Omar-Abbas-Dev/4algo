using MediatR;
using Microsoft.Extensions.Logging;
using NavX.Application.Abstractions;
using NavX.Application.Common;

namespace NavX.Application.Behaviors;

public sealed class CachingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICacheService _cacheService;
    private readonly ILogger<CachingBehavior<TRequest, TResponse>> _logger;

    public CachingBehavior(
        ICacheService cacheService,
        ILogger<CachingBehavior<TRequest, TResponse>> logger)
    {
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is not ICacheableQuery cacheable)
        {
            return await next();
        }

        var cached = await _cacheService.GetAsync<TResponse>(cacheable.CacheKey, cancellationToken);
        if (cached is not null)
        {
            _logger.LogDebug("Cache hit for key: {CacheKey}", cacheable.CacheKey);
            return cached;
        }

        _logger.LogDebug("Cache miss for key: {CacheKey}. Fetching...", cacheable.CacheKey);
        var response = await next();
        if (response is not null)
        {
            await _cacheService.SetAsync(cacheable.CacheKey, response, cacheable.Duration, cancellationToken);
        }

        return response;
    }
}
