using Microsoft.EntityFrameworkCore;
using NavX.Domain.Common;
using NavX.Infrastructure.Persistence;

namespace NavX.Infrastructure.Persistence.Repositories;

/// <summary>
/// Generic repository base class encapsulating EF Core DbSet access.
/// </summary>
public abstract class Repository<TEntity, TId> where TEntity : Entity<TId>
{
    protected readonly AppDbContext Context;
    protected readonly DbSet<TEntity> DbSet;

    protected Repository(AppDbContext context)
    {
        Context = context;
        DbSet = context.Set<TEntity>();
    }

    public virtual async Task<TEntity?> GetByIdAsync(TId id, CancellationToken ct = default)
    {
        return await DbSet.FindAsync(new object?[] { id }, ct);
    }

    public virtual async Task AddAsync(TEntity entity, CancellationToken ct = default)
    {
        await DbSet.AddAsync(entity, ct);
    }

    public virtual Task DeleteAsync(TEntity entity, CancellationToken ct = default)
    {
        DbSet.Remove(entity);
        return Task.CompletedTask;
    }
}
