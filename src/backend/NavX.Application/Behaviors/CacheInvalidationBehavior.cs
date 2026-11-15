using MediatR;
using Microsoft.Extensions.Logging;
using NavX.Application.Abstractions;
using NavX.Application.Common;

namespace NavX.Application.Behaviors;

public sealed class CacheInvalidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICacheService _cacheService;
    private readonly ILogger<CacheInvalidationBehavior<TRequest, TResponse>> _logger;

    public CacheInvalidationBehavior(
        ICacheService cacheService,
        ILogger<CacheInvalidationBehavior<TRequest, TResponse>> logger)
    {
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var response = await next();

        if (request is ICacheInvalidatingCommand command)
        {
            foreach (var prefix in command.PrefixesToEvict)
            {
                _logger.LogInformation("Invalidating cache for prefix: {Prefix}", prefix);
                await _cacheService.RemoveByPrefixAsync(prefix, cancellationToken);
            }
        }

        return response;
    }
}
