namespace NavX.Domain.Enums;

/// <summary>
/// Map cell classification and movement cost values.
/// </summary>
public enum CellType
{
    Blocked = -1,
    Open = 1,
    Traffic = 5
}
