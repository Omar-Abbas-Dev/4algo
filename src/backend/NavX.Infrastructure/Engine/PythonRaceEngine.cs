using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NavX.Application.Abstractions;
using NavX.Domain.Enums;
using NavX.Domain.Exceptions;
using NavX.Domain.ValueObjects;

namespace NavX.Infrastructure.Engine;

/// <summary>
/// Executes search algorithms by invoking the Python Algorithm Engine via stdin/stdout IPC.
/// </summary>
public sealed class PythonRaceEngine : IRaceEngine
{
    private readonly PythonEngineOptions _options;
    private readonly ILogger<PythonRaceEngine> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public PythonRaceEngine(
        IOptions<PythonEngineOptions> options,
        ILogger<PythonRaceEngine> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<EngineExecutionResult> RunAsync(
        int[][] grid,
        Position start,
        Position goal,
        IReadOnlyList<string>? algorithms = null,
        CancellationToken ct = default)
    {
        var request = new EngineRaceRequest(
            ContractVersion: 1,
            Grid: grid,
            Start: new[] { start.Row, start.Col },
            Goal: new[] { goal.Row, goal.Col },
            Algorithms: algorithms);

        var requestJson = JsonSerializer.Serialize(request, JsonOptions);

        var (executable, scriptPath) = ResolvePaths();

        _logger.LogInformation("Invoking Python Engine: {Executable} {ScriptPath}", executable, scriptPath);

        var startInfo = new ProcessStartInfo
        {
            FileName = executable,
            Arguments = $"\"{scriptPath}\"",
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = startInfo };
        try
        {
            process.Start();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to launch Python engine process '{executable}': {ex.Message}", ex);
        }

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(_options.TimeoutSeconds));

        try
        {
            await process.StandardInput.WriteAsync(requestJson.AsMemory(), timeoutCts.Token);
            await process.StandardInput.FlushAsync(timeoutCts.Token);
            process.StandardInput.Close();

            var stdoutTask = process.StandardOutput.ReadToEndAsync(timeoutCts.Token);
            var stderrTask = process.StandardError.ReadToEndAsync(timeoutCts.Token);

            await process.WaitForExitAsync(timeoutCts.Token);

            var stdout = await stdoutTask;
            var stderr = await stderrTask;

            if (process.ExitCode != 0)
            {
                _logger.LogError("Python engine exited with code {ExitCode}. Stderr: {Stderr}", process.ExitCode, stderr);
                string errorMessage = stderr;
                try
                {
                    var errObj = JsonSerializer.Deserialize<EngineErrorResponse>(stderr, JsonOptions);
                    if (!string.IsNullOrEmpty(errObj?.Error)) errorMessage = errObj.Error;
                }
                catch
                {
                    // Fall back to raw stderr
                }
                throw new DomainException($"Python engine error (exit code {process.ExitCode}): {errorMessage}");
            }

            var response = JsonSerializer.Deserialize<EngineRaceResponse>(stdout, JsonOptions)
                ?? throw new InvalidOperationException("Failed to deserialize Python engine response.");

            var results = response.Results.Select(r =>
            {
                var algoType = ParseAlgorithmType(r.Algorithm);
                var path = r.Path?.Select(p => new Position(p[0], p[1])).ToList();
                var explored = r.Explored.Select(p => new Position(p[0], p[1])).ToList();
                return new EngineAlgorithmResult(algoType, path, explored, r.Cost, r.TimeMs);
            }).ToList();

            return new EngineExecutionResult(results, FromCache: false);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            try { process.Kill(entireProcessTree: true); } catch { /* ignore */ }
            throw new TimeoutException($"Python engine timed out after {_options.TimeoutSeconds} seconds.");
        }
    }

    private (string executable, string scriptPath) ResolvePaths()
    {
        // 1. Resolve the Python executable
        //    Priority: config value → OS-aware PATH search
        string executable = _options.Executable;

        if (!string.IsNullOrWhiteSpace(executable) && File.Exists(executable))
        {
            // Config value is an absolute path that exists — use it directly
        }
        else
        {
            // Fall back to whatever "python" or "python3" resolves to on PATH.
            // On Windows Anaconda / standard installs this is "python".
            // On Linux / macOS it is usually "python3".
            executable = OperatingSystem.IsWindows() ? "python" : "python3";
        }

        // 2. Resolve the engine script path (walks up to solution root)
        string scriptPath = _options.EnginePath;
        if (!File.Exists(scriptPath))
        {
            string candidate = Path.Combine(AppContext.BaseDirectory, _options.EnginePath);
            if (File.Exists(candidate))
            {
                scriptPath = candidate;
            }
            else
            {
                var dir = new DirectoryInfo(AppContext.BaseDirectory);
                while (dir != null && !File.Exists(Path.Combine(dir.FullName, _options.EnginePath)))
                {
                    dir = dir.Parent;
                }
                if (dir != null)
                {
                    scriptPath = Path.Combine(dir.FullName, _options.EnginePath);
                }
            }
        }

        return (executable, Path.GetFullPath(scriptPath));
    }

    private static AlgorithmType ParseAlgorithmType(string name) => name.ToUpperInvariant() switch
    {
        "BFS" => AlgorithmType.BFS,
        "DFS" => AlgorithmType.DFS,
        "GREEDY" => AlgorithmType.Greedy,
        "A*" or "ASTAR" => AlgorithmType.AStar,
        _ => Enum.TryParse<AlgorithmType>(name, true, out var res) ? res : AlgorithmType.BFS
    };
}
