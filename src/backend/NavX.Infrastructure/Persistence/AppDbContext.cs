using Microsoft.EntityFrameworkCore;
using NavX.Domain.Entities;

namespace NavX.Infrastructure.Persistence;

public sealed class AppDbContext : DbContext
{
    public DbSet<Race> Races => Set<Race>();
    public DbSet<SavedMap> Maps => Set<SavedMap>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
