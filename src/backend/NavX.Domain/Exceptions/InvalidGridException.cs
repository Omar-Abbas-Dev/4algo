namespace NavX.Domain.Exceptions;

/// <summary>
/// Thrown when grid dimensions, cells, or traversability violate domain invariants.
/// </summary>
public sealed class InvalidGridException : DomainException
{
    public InvalidGridException(string message) : base(message) { }
}
