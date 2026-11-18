using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NavX.Application.Abstractions;
using NavX.Domain.Services;
using NavX.Infrastructure.Caching;
using NavX.Infrastructure.Engine;
using NavX.Infrastructure.Persistence;
using NavX.Infrastructure.Persistence.Repositories;
using NavX.Infrastructure.Services;

namespace NavX.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. Database (SQLite)
        // Resolve DB path to <solution-root>/data/ so the file never lands inside the API layer.
        // The connection string in appsettings.json uses a logical relative path (e.g. "data/navx_arena.db").
        // Infrastructure is responsible for anchoring it to an absolute location — the API layer is not involved.
        string rawConnection = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=data/navx_arena.db;Cache=Shared";

        string connectionString = ResolveDbConnectionString(rawConnection);

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlite(connectionString);
        });

        // 2. Repositories and Unit of Work (Scoped)
        services.AddScoped<IRaceRepository, RaceRepository>();
        services.AddScoped<IMapRepository, MapRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // 3. Winner Policy (Singleton — stateless)
        services.AddSingleton<IWinnerPolicy, WinnerPolicyService>();

        // 3. Caching (Singleton)
        services.AddMemoryCache();
        services.AddSingleton<ICacheService, MemoryCacheService>();

        // 4. Python Engine Options & Configuration
        services.Configure<PythonEngineOptions>(configuration.GetSection(PythonEngineOptions.SectionName));

        // 5. Engine & Cached Decorator Registration
        services.AddScoped<PythonRaceEngine>();
        services.AddScoped<IRaceEngine>(sp => new CachedRaceEngine(
            sp.GetRequiredService<PythonRaceEngine>(),
            sp.GetRequiredService<ICacheService>(),
            sp.GetRequiredService<ILogger<CachedRaceEngine>>()));

        return services;
    }

    /// <summary>
    /// If the SQLite Data Source is a relative path, anchors it to the solution root's /data directory.
    /// This ensures the .db file never lands inside the API project folder regardless of CWD or build output.
    /// </summary>
    private static string ResolveDbConnectionString(string rawConnectionString)
    {
        // Extract "Data Source=<value>" from the connection string
        const string prefix = "Data Source=";
        var parts = rawConnectionString.Split(';');
        int srcIndex = Array.FindIndex(parts, p => p.TrimStart().StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
        if (srcIndex < 0) return rawConnectionString;

        string sourcePart = parts[srcIndex].TrimStart();
        string dataSource = sourcePart[prefix.Length..];

        // Only resolve if it is a relative path (not ":memory:" or already absolute)
        if (dataSource == ":memory:" || Path.IsPathRooted(dataSource))
            return rawConnectionString;

        // Walk up from the binary directory to find the solution root (the folder containing *.slnx or *.sln)
        string absolutePath = ResolveRelativeToSolutionRoot(dataSource);

        // Ensure the target directory exists
        string? dir = Path.GetDirectoryName(absolutePath);
        if (dir is not null) Directory.CreateDirectory(dir);

        parts[srcIndex] = $"{prefix}{absolutePath}";
        return string.Join(';', parts);
    }

    /// <summary>
    /// Walks up from AppContext.BaseDirectory to find the directory that contains a .slnx or .sln file,
    /// then combines it with the given relative path. Falls back to a /data folder beside the binary.
    /// </summary>
    private static string ResolveRelativeToSolutionRoot(string relativePath)
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            if (dir.GetFiles("*.slnx").Length > 0 || dir.GetFiles("*.sln").Length > 0)
                return Path.GetFullPath(Path.Combine(dir.FullName, relativePath));
            dir = dir.Parent;
        }

        // Fallback: resolve relative to the binary directory
        return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, relativePath));
    }
}
