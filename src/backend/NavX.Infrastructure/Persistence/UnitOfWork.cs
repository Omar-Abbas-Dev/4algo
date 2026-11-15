using NavX.Application.Abstractions;

namespace NavX.Infrastructure.Persistence;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public IRaceRepository Races { get; }
    public IMapRepository Maps { get; }

    public UnitOfWork(AppDbContext context, IRaceRepository races, IMapRepository maps)
    {
        _context = context;
        Races = races;
        Maps = maps;
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _context.SaveChangesAsync(ct);
    }
}
