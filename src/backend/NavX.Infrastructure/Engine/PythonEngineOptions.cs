namespace NavX.Infrastructure.Engine;

/// <summary>
/// Options for configuring the external Python Algorithm Engine process.
/// </summary>
public sealed class PythonEngineOptions
{
    public const string SectionName = "PythonEngine";

    public string Executable { get; set; } = "D:\\Programmes\\Anaconda\\python.exe";
    public string EnginePath { get; set; } = "src/backend/NavX.AlgorithmEngine/main.py";
    public int TimeoutSeconds { get; set; } = 10;
}
