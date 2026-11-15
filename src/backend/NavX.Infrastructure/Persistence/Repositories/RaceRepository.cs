using Microsoft.EntityFrameworkCore;
using NavX.Application.Abstractions;
using NavX.Application.Common;
using NavX.Domain.Entities;
using NavX.Domain.Enums;

namespace NavX.Infrastructure.Persistence.Repositories;

public sealed class RaceRepository : Repository<Race, Guid>, IRaceRepository
{
    public RaceRepository(AppDbContext context) : base(context)
    {
    }

    public override async Task<Race?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await DbSet
            .Include(r => r.Results)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, ct);
    }

    public async Task<PagedResult<Race>> GetHistoryAsync(int page, int pageSize, CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        int totalCount = await DbSet.CountAsync(ct);

        var items = await DbSet
            .Include(r => r.Results)
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<Race>(items, page, pageSize, totalCount);
    }

    public async Task<IReadOnlyDictionary<AlgorithmType, int>> GetWinCountsAsync(CancellationToken ct = default)
    {
        var rawWins = await DbSet
            .Where(r => r.Winner != null)
            .GroupBy(r => r.Winner)
            .Select(g => new { Winner = g.Key!.Value, Count = g.Count() })
            .ToListAsync(ct);

        var dict = new Dictionary<AlgorithmType, int>();
        foreach (var item in rawWins)
        {
            dict[item.Winner] = item.Count;
        }

        return dict;
    }

    public async Task<int> GetTotalCountAsync(CancellationToken ct = default)
    {
        return await DbSet.CountAsync(ct);
    }
}
