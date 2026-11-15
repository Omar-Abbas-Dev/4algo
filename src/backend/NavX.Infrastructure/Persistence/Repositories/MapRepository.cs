using Microsoft.EntityFrameworkCore;
using NavX.Application.Abstractions;
using NavX.Domain.Entities;

namespace NavX.Infrastructure.Persistence.Repositories;

public sealed class MapRepository : Repository<SavedMap, Guid>, IMapRepository
{
    public MapRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<SavedMap>> GetAllAsync(CancellationToken ct = default)
    {
        return await DbSet
            .AsNoTracking()
            .OrderBy(m => m.Name)
            .ToListAsync(ct);
    }
}
