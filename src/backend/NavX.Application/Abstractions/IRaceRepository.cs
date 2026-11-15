using NavX.Application.Common;
using NavX.Domain.Entities;
using NavX.Domain.Enums;

namespace NavX.Application.Abstractions;

public interface IRaceRepository
{
    Task AddAsync(Race race, CancellationToken ct = default);
    Task<Race?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PagedResult<Race>> GetHistoryAsync(int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyDictionary<AlgorithmType, int>> GetWinCountsAsync(CancellationToken ct = default);
    Task<int> GetTotalCountAsync(CancellationToken ct = default);
}
