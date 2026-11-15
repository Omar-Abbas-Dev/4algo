using MediatR;
using NavX.Application.Abstractions;
using NavX.Application.Common;

namespace NavX.Application.Maps.Commands.DeleteMap;

public record DeleteMapCommand(Guid Id) : IRequest<bool>, ICacheInvalidatingCommand
{
    public IReadOnlyList<string> PrefixesToEvict => new[] { "maps:" };
}

public sealed class DeleteMapCommandHandler : IRequestHandler<DeleteMapCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteMapCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeleteMapCommand request, CancellationToken cancellationToken)
    {
        var map = await _unitOfWork.Maps.GetByIdAsync(request.Id, cancellationToken);
        if (map is null) return false;

        await _unitOfWork.Maps.DeleteAsync(map, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
