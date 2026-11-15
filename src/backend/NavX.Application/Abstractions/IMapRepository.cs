using NavX.Domain.Entities;

namespace NavX.Application.Abstractions;

public interface IMapRepository
{
    Task AddAsync(SavedMap map, CancellationToken ct = default);
    Task<SavedMap?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<SavedMap>> GetAllAsync(CancellationToken ct = default);
    Task DeleteAsync(SavedMap map, CancellationToken ct = default);
}
