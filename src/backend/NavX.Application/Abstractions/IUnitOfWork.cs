namespace NavX.Application.Abstractions;

public interface IUnitOfWork
{
    IRaceRepository Races { get; }
    IMapRepository Maps { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
