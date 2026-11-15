using NavX.Domain.Enums;

namespace NavX.Infrastructure.Audio;

/// <summary>
/// Abstraction for synthesized audio generation in .NET using NAudio.
/// </summary>
public interface ISoundEffectGenerator
{
    byte[] GenerateToneWav(SignalType signalType, double frequencyHz, double durationSeconds, float volume = 0.5f, float pan = 0.0f);
    byte[] GenerateArrivalArpeggio(AlgorithmType algorithm);
    byte[] GenerateWinnerFanfare();
    byte[] GenerateTrafficHonk();
    byte[] GenerateExploredTick(int heuristicDistance);
    byte[] GenerateEventSound(string eventName);
    IReadOnlyDictionary<string, byte[]> PreGenerateAllAssets();
}
